from transformers import AutoTokenizer, AutoModelForCausalLM
from app.schemas.input_schema import InputSchema
BASE_PATH = "./app/models/polyglot_base"

tokenizer = None
model = None

def generate_text(prompt: str) -> str:
    global tokenizer, model

    if tokenizer is None or model is None:
        tokenizer = AutoTokenizer.from_pretrained(BASE_PATH)
        model = AutoModelForCausalLM.from_pretrained(BASE_PATH)

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    outputs = model.generate(**inputs, max_new_tokens=256)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

def generate_answer(input):
    return generate_text(input.content)