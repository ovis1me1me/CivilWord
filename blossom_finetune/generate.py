from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from peft import PeftModel
import torch
import os

# 경로 설정
base_model = "azure99/blossom-v6.1-8b"
adapter_path = os.path.abspath("./blossom-qlora-final")

# tokenizer는 base model 말고 adapter_path에서 로딩 (토크나이저 파일 있음)
tokenizer = AutoTokenizer.from_pretrained(
    adapter_path,
    local_files_only=True,
    token=None,
    trust_remote_code=True
)

# base model은 HF Hub에서 로드, QLoRA로 압축
model = AutoModelForCausalLM.from_pretrained(
    base_model,
    device_map="auto",
    load_in_4bit=True,
    torch_dtype=torch.bfloat16,
    trust_remote_code=True,
    token=True  # 로그인 되어있다면 가능
)

# LoRA weight 병합
model = PeftModel.from_pretrained(
    model,
    adapter_path,
    is_trainable=False,
    local_files_only=True
)

pipe = pipeline("text-generation", model=model, tokenizer=tokenizer, device=0)

# 테스트 프롬프트
prompt = """### Instruction:
다음 민원을 공공기관 답변 문체로 요약하세요.

### Input:
화명1동 주차 문제가 심각하여 차량 통행에 불편을 겪고 있습니다.

### Response:
"""

out = pipe(prompt, max_new_tokens=128, do_sample=True, temperature=0.7)[0]['generated_text']
print(out)
