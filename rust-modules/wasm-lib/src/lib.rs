use wasm_bindgen::prelude::*;
use regex::Regex;
use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};

#[derive(Serialize, Deserialize)]
struct LogEntry {
    ip: String,
    timestamp: String,
    method: String,
    url: String,
    status: String,
    user_agent: String,
}

#[derive(Serialize, Deserialize)]
struct ProcessedLogs {
    processed_logs: String,
    hash: String,
}

#[wasm_bindgen]
pub fn process_and_hash_logs(log_data: &str) -> String {
    let log_regex = Regex::new(
        r#"(?P<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}) - - \[(?P<timestamp>[^\]]+)\] "(?P<method>GET|POST|PUT|DELETE|OPTIONS|PATCH|HEAD|CONNECT|TRACE)? ?(?P<url>[^"]+)? HTTP/\d\.\d" (?P<status>\d{3}) \d+ "(?P<referrer>[^"]*)" "(?P<user_agent>[^"]*)""#
    ).unwrap();

    let mut log_entries = Vec::new();

    for line in log_data.lines() {
        if let Some(caps) = log_regex.captures(line) {
            log_entries.push(LogEntry {
                ip: caps.name("ip").map_or("", |m| m.as_str()).to_string(),
                timestamp: caps.name("timestamp").map_or("", |m| m.as_str()).to_string(),
                method: caps.name("method").map_or("", |m| m.as_str()).to_string(),
                url: caps.name("url").map_or("", |m| m.as_str()).to_string(),
                status: caps.name("status").map_or("", |m| m.as_str()).to_string(),
                user_agent: caps.name("user_agent").map_or("", |m| m.as_str()).to_string(),
            });
        }
    }

    let logs_json = serde_json::to_string(&log_entries).unwrap();

    // Create a new SHA256 object and process the consistent JSON string
    let mut hasher = Sha256::new();
    hasher.update(logs_json.as_bytes());
    let hash = format!("{:x}", hasher.finalize());

    serde_json::to_string(&ProcessedLogs { processed_logs: logs_json, hash }).unwrap()
}
