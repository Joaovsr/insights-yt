export function loadConfig(env = process.env) {
  const youtubeApiKey = secret(env, "YOUTUBE_API_KEY");
  const openaiApiKey = secret(env, "OPENAI_API_KEY");
  if (!youtubeApiKey || !openaiApiKey) {
    throw new Error("YOUTUBE_API_KEY and OPENAI_API_KEY are required");
  }

  return {
    youtubeApiKey,
    openaiApiKey,
    openaiModel: env.OPENAI_MODEL || "gpt-5.6-luna",
    reasoningEffort: env.OPENAI_REASONING_EFFORT || "low",
    openaiTimeoutMs: parseDuration(env.OPENAI_TIMEOUT || "2m30s"),
    debugPayloads: parseBoolean(env.DEBUG_PAYLOAD_LOGS || "false", "DEBUG_PAYLOAD_LOGS"),
  };
}

export function parseHttpAddress(env = process.env) {
  if (env.HTTP_HOST || env.PORT) {
    return { host: env.HTTP_HOST || "127.0.0.1", port: parsePort(env.PORT || "8080") };
  }
  const address = env.HTTP_ADDRESS || "127.0.0.1:8080";
  const separator = address.lastIndexOf(":");
  if (separator < 0) throw new Error("HTTP_ADDRESS deve usar o formato host:porta.");
  return {
    host: address.slice(0, separator) || "0.0.0.0",
    port: parsePort(address.slice(separator + 1)),
  };
}

export function parseDuration(value) {
  const source = String(value).trim();
  const pattern = /(\d+(?:\.\d+)?)(ms|s|m|h)/gy;
  const factors = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000 };
  let total = 0;
  let consumed = 0;
  for (const match of source.matchAll(pattern)) {
    if (match.index !== consumed) throw new Error("OPENAI_TIMEOUT must be a positive duration");
    total += Number(match[1]) * factors[match[2]];
    consumed += match[0].length;
  }
  if (consumed !== source.length || !Number.isFinite(total) || total <= 0) {
    throw new Error("OPENAI_TIMEOUT must be a positive duration");
  }
  return total;
}

function secret(env, name) {
  return String(env[name] || "").trim();
}

function parseBoolean(value, name) {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be true or false`);
}

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("A porta HTTP deve ser um número inteiro entre 1 e 65535.");
  }
  return port;
}
