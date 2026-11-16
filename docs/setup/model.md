# 3. Model

The bot works with any model pi supports, as long as the model can **call tools** reliably. Pick one of these routes:

| Route | Good for | You manage |
|---|---|---|
| **A. TokenVisor** | Using a model served by a TokenVisor deployment | An account and API key |
| **B. Self-hosted vLLM** | Full control, data stays on your hardware | A GPU server |
| **C. Another provider pi supports** | Quick start with a hosted API | An API key |

The reference model is **`Qwen/Qwen3.6-35B-A3B`**: a mixture-of-experts model with about 3B active parameters, a 256k-token context window, tool calling, and image input.

## A. TokenVisor

Install the provider package as `pi-bot`, and give it your key the way its [README](https://github.com/EmbeddedLLM/tokenvisor-pi) describes:

```bash
sudo -u pi-bot -i /home/pi-bot/.pi/agent/bin/pi install git:github.com/EmbeddedLLM/tokenvisor-pi
```

It discovers the models on your account and registers them under the provider `TokenVisor`. It takes each model's context window and output limit from what the server reports; if the server reports none, pi assumes 128k tokens.

Allow only the model you want in `~/.pi/agent/settings.json` (an example is in `deploy/pi-settings.example.json`):

```json
{
  "enabledModels": ["TokenVisor/Qwen/Qwen3.6-35B-A3B"]
}
```

To force the model for every request regardless of pi's default, set `PI_PROVIDER` and `PI_MODEL` in `.env`.

## B. Self-hosted vLLM

On the GPU server, start vLLM with tool-call parsing turned on. These flags matter:

```bash
vllm serve Qwen/Qwen3.6-35B-A3B --enable-auto-tool-choice --tool-call-parser qwen3_coder --reasoning-parser qwen3 --max-model-len 262144
```

| Flag | Why |
|---|---|
| `--enable-auto-tool-choice --tool-call-parser qwen3_coder` | Turns the model's tool calls into real tool calls. Without it, tool calls arrive as text like `<parameter=query>` and nothing runs. |
| `--reasoning-parser qwen3` | Keeps the model's thinking out of the answer. |
| `--max-model-len 262144` | The full 256k context. Lower it if GPU memory is short. |

Add `--tensor-parallel-size N` for N GPUs, and your usual `--port`, `--api-key` and memory flags. Don't add `--language-model-only`: it turns off image input. Use a vLLM version the model card supports.

**GPU memory.** 35B parameters in 16-bit weights take about 70 GB before any context cache. Typical choices are one 192 GB GPU (AMD MI300X), two 80 GB GPUs with tensor parallelism, or one 80 GB GPU with an 8-bit (FP8) checkpoint. Long contexts need extra memory for the cache. Price ranges are on the [Costs](/costs#the-model) page.

Then point pi at it in `/home/pi-bot/.pi/agent/models.json`. An example is in `deploy/pi-models.vllm.example.json`:

```json
{
  "providers": {
    "vllm": {
      "baseUrl": "http://MODEL-SERVER:8000/v1",
      "api": "openai-completions",
      "apiKey": "your-vllm-api-key",
      "models": [
        {
          "id": "Qwen/Qwen3.6-35B-A3B",
          "reasoning": true,
          "input": ["text", "image"],
          "contextWindow": 262144,
          "maxTokens": 32768
        }
      ]
    }
  }
}
```

- **`input: ["text", "image"]`** is what lets pi send uploaded images to the model.
- **`contextWindow`** defaults to 128,000 when left out. Set it to the server's `max_model_len`.
- **`maxTokens`** defaults to 16,384. Thinking counts toward it, so long reports can be cut off at the default.

The sampling values the model card recommends (thinking mode: temperature 1.0, top_p 0.95, top_k 20, presence_penalty 1.5) go in `samplingParams`. If tool calls are sometimes malformed, a lower temperature (about 0.6) and presence penalty (0.5 to 1.0) help.

## Tool calling

Check the model server directly. The answer must contain a `tool_calls` field, not tags inside `content`:

```bash
curl -s http://MODEL-SERVER:8000/v1/chat/completions -H "Content-Type: application/json" -d '{"model":"Qwen/Qwen3.6-35B-A3B","messages":[{"role":"user","content":"What is the weather in Paris? Use the tool."}],"tools":[{"type":"function","function":{"name":"get_weather","parameters":{"type":"object","properties":{"city":{"type":"string"}},"required":["city"]}}}]}'
```

Then check through pi, as the bot runs it. The output should contain a `tool_execution_start` event:

```bash
cd /opt/pi-workspace && sudo -u pi-bot -i /home/pi-bot/.pi/agent/bin/pi --mode json --no-session --tools read,ls "List the files here using the ls tool"
```

## Compaction

When a conversation nears the context window, pi summarises older turns ("compaction"). It starts when *context tokens > context window − `reserveTokens`*. For a 256k model, these values in `~/.pi/agent/settings.json` leave room for a large tool result and still keep recent turns word for word:

```json
{
  "compaction": {
    "enabled": true,
    "reserveTokens": 40000,
    "keepRecentTokens": 30000
  }
}
```

With a 262,144-token window, compaction then starts at about 222k tokens.
