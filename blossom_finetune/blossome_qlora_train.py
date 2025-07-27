import torch
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    BitsAndBytesConfig,
    DataCollatorForLanguageModeling,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training, TaskType
import os

# 모델 이름
model_name = "azure99/blossom-v6.1-8b"

# Tokenizer 로딩
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token  # 필수: padding 토큰 지정

# 4bit 양자화 설정
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=torch.bfloat16
)

# 모델 로딩
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True
)

# 4bit 학습 준비 (중요!)
model = prepare_model_for_kbit_training(model)
model.gradient_checkpointing_enable()

# QLoRA 설정
peft_config = LoraConfig(
    r=8,
    lora_alpha=16,
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
    target_modules=["q_proj", "v_proj"]
)

# PEFT 모델 생성
model = get_peft_model(model, peft_config)

# 🔍 학습 가능한 파라미터 출력
model.print_trainable_parameters()

# 데이터셋 로딩
dataset = load_dataset("json", data_files="train/train_dataset.jsonl", split="train")

# 전처리 함수
def preprocess(example):
    prompt = f"{example['prompt']}\n\n### Response:\n"
    response = example["completion"]
    full_text = prompt + response

    tokens = tokenizer(
        full_text,
        max_length=512,
        padding="max_length",
        truncation=True,
    )

    return {
        "input_ids": tokens["input_ids"],
        "attention_mask": tokens["attention_mask"],
        "labels": tokens["input_ids"],  # 필수
    }

# 전처리 적용
dataset = dataset.map(preprocess, remove_columns=dataset.column_names)

# 데이터 콜레이터
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False
)

# 학습 인자 설정
training_args = TrainingArguments(
    output_dir="blossom-qlora-output",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=2,
    warmup_steps=10,
    learning_rate=2e-4,
    logging_steps=10,
    save_steps=250,
    save_total_limit=2,
    bf16=False,
    fp16=True,
    gradient_checkpointing=True,
    report_to="none",
    optim="adamw_torch_fused",
)

# Trainer 구성
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    data_collator=data_collator,
    tokenizer=tokenizer,
)

# 학습 시작
trainer.train()
