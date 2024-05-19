use regex::Regex;
use serde::Serialize;
use serde_json::json;
use wasm_bindgen::prelude::*;

#[derive(Serialize)]
struct LogEntry {
    ip: String,
    timestamp: String,
    method: String,
    url: String,
    status: String,
    user_agent: String,
}

#[wasm_bindgen]
pub fn process_logs(log_data: &str) -> String {
    let log_regex = Regex::new(
        r#"(?P<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}) - - \[(?P<timestamp>[^\]]+)\] "(?P<method>GET|POST|PUT|DELETE|OPTIONS|PATCH|HEAD|CONNECT|TRACE)? ?(?P<url>[^"]+)? HTTP/\d\.\d" (?P<status>\d{3}) \d+ "(?P<referrer>[^"]*)" "(?P<user_agent>[^"]*)""#
    ).unwrap();

    let mut log_entries = Vec::new();

    for line in log_data.lines() {
        if let Some(caps) = log_regex.captures(line) {
            log_entries.push(LogEntry {
                ip: caps.name("ip").map_or("", |m| m.as_str()).to_string(),
                timestamp: caps
                    .name("timestamp")
                    .map_or("", |m| m.as_str())
                    .to_string(),
                method: caps.name("method").map_or("", |m| m.as_str()).to_string(),
                url: caps.name("url").map_or("", |m| m.as_str()).to_string(),
                status: caps.name("status").map_or("", |m| m.as_str()).to_string(),
                user_agent: caps
                    .name("user_agent")
                    .map_or("", |m| m.as_str())
                    .to_string(),
            });
        }
    }

    serde_json::to_string_pretty(&log_entries).unwrap()
}

#[wasm_bindgen]
pub fn create_hash(data: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    data.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

// Adding the main function for testing
fn main() {
    let log_entries = r#"
    83.149.9.216 - - [17/May/2015:10:05:03 +0000] "GET /presentations/logstash-monitorama-2013/images/kibana-search.png HTTP/1.1" 200 203023 "http://semicomplete.com/presentations/logstash-monitorama-2013/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36"
    83.149.9.216 - - [17/May/2015:10:05:43 +0000] "GET /presentations/logstash-monitorama-2013/images/kibana-dashboard3.png HTTP/1.1" 200 171717 "http://semicomplete.com/presentations/logstash-monitorama-2013/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36"
    "#;

    let processed_logs = process_logs(log_entries);
    println!("Processed Logs:\n{}", processed_logs);
}
