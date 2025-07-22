from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments
from trl import SFTTrainer
from peft import LoraConfig, get_peft_model
from datasets import load_dataset
import torch

# 1. 모델 경로
model_path = "/home/ubuntu/.ollama/models/blossom-v6.1"

# 2. Dataset 로드
dataset = load_dataset("json", data_files="./train/train_dataset.jsonl")  # prompt, completion 쌍

# 3. Tokenizer 및 모델 로드
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForCausalLM.from_pretrained(model_path, device_map="auto")

# 4. LoRA 설정
lora_config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)
model = get_peft_model(model, lora_config)

# 5. 학습 인자
training_args = TrainingArguments(
    output_dir="./output",
    per_device_train_batch_size=1,
    gradient_accumulation_steps=4,
    num_train_epochs=3,
    logging_steps=10,
    save_steps=100,
    learning_rate=2e-4,
    bf16=True if torch.cuda.is_available() else False,
    fp16=True,
    report_to="none"
)

# 6. Trainer 정의
trainer = SFTTrainer(
    model=model,
    train_dataset=dataset["train"],
    tokenizer=tokenizer,
    args=training_args,
    formatting_func=lambda example: f"### Input:\n{example['prompt']}\n### Response:\n{example['completion']}"
)

# 7. 학습 및 저장
trainer.train()
trainer.save_model("./output")
