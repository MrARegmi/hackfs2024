use nom::{
    bytes::complete::{take_till1, take_while1},
    character::complete::{alphanumeric1, digit1, space1},
    sequence::tuple,
    IResult,
};
use regex::Regex;
use serde::Serialize;
use wasm_bindgen::prelude::*;

#[derive(Serialize, Debug)]
struct LogEntry {
    ip: Option<String>,
    timestamp: String,
    method: String,
    url: String,
    status: String,
    user_agent: String,
}

fn parse_ip(input: &str) -> IResult<&str, &str> {
    take_till1(|c| c == ' ')(input)
}

fn parse_timestamp(input: &str) -> IResult<&str, &str> {
    let (input, (timestamp, _)) = tuple((take_till1(|c| c == ' '), space1))(input)?;
    Ok((input, timestamp))
}

fn parse_method(input: &str) -> IResult<&str, &str> {
    alphanumeric1(input)
}

fn parse_url(input: &str) -> IResult<&str, &str> {
    take_till1(|c| c == ' ' || c == '"')(input)
}

fn parse_status(input: &str) -> IResult<&str, &str> {
    digit1(input)
}

fn parse_user_agent(input: &str) -> IResult<&str, &str> {
    take_till1(|c| c == '\n')(input)
}

fn parse_info_log_entry(log_entry: &str) -> Option<LogEntry> {
    println!("Parsing INFO log entry: {}", log_entry);

    let parts: Vec<&str> = log_entry.split('"').collect();
    println!("Parts after split by \": {:?}", parts);

    if parts.len() < 3 {
        return None;
    }

    let ip_part = parts[0];
    let method_part = parts[1];
    let rest = parts[2];

    println!(
        "ip_part: {}, method_part: {}, rest: {}",
        ip_part, method_part, rest
    );

    let ip_and_port: Vec<&str> = ip_part.split_whitespace().collect();
    if ip_and_port.len() < 2 {
        return None;
    }
    let ip = ip_and_port[1].to_string();

    let method_parts: Vec<&str> = method_part.split_whitespace().collect();
    if method_parts.len() < 2 {
        return None;
    }
    let method = method_parts[0].to_string();
    let url = method_parts[1].to_string();

    let status_and_user_agent: Vec<&str> = rest.split_whitespace().collect();
    if status_and_user_agent.len() < 1 {
        return None;
    }
    let status = status_and_user_agent[0].to_string();
    let user_agent = if status_and_user_agent.len() > 1 {
        status_and_user_agent[1..].join(" ")
    } else {
        "".to_string()
    };

    Some(LogEntry {
        ip: Some(ip),
        timestamp: "".to_string(),
        method,
        url,
        status,
        user_agent,
    })
}

fn parse_regular_log_entry(log_entry: &str, timestamp: &str) -> Option<LogEntry> {
    println!("Parsing regular log entry: {}", log_entry);

    let parts: Vec<&str> = log_entry.split_whitespace().collect();
    println!("Parts after split by whitespace: {:?}", parts);

    if parts.len() < 6 {
        return None;
    }

    let method = parts[0].to_string();
    let url = parts[5].to_string();
    let status = parts[6].to_string();
    let user_agent = if parts.len() > 7 {
        parts[7..].join(" ")
    } else {
        "".to_string()
    };

    Some(LogEntry {
        ip: None,
        timestamp: timestamp.to_string(),
        method,
        url,
        status,
        user_agent,
    })
}

fn parse_log_entry(log_entry: &str, timestamp: &str) -> Option<LogEntry> {
    if log_entry.contains("INFO:") {
        parse_info_log_entry(log_entry)
    } else {
        parse_regular_log_entry(log_entry, timestamp)
    }
}

#[wasm_bindgen]
pub fn process_logs(log_data: &str) -> String {
    let timestamp_regex =
        Regex::new(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} \w{3}$").unwrap();
    let mut log_entries = Vec::new();
    let mut current_entry = String::new();
    let mut current_timestamp = String::new();

    for line in log_data.lines() {
        println!("Processing line: {}", line);

        if line.trim().is_empty() {
            continue;
        }

        if timestamp_regex.is_match(line) {
            if !current_entry.is_empty() {
                if let Some(entry) = parse_log_entry(&current_entry, &current_timestamp) {
                    log_entries.push(entry);
                }
                current_entry.clear();
            }
            current_timestamp = line.to_string();
        } else {
            if !current_timestamp.is_empty() {
                if !current_entry.is_empty() {
                    current_entry.push_str(" ");
                }
                current_entry.push_str(line);
            }
        }
    }

    if !current_entry.is_empty() {
        if let Some(entry) = parse_log_entry(&current_entry, &current_timestamp) {
            log_entries.push(entry);
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
2024-05-16 17:43:04.000 EDT
POST 922 B4 msEdge 44 https://backend-service-rojjrgeqna-ue.a.run.app/api/blog/posts_fetch/
2024-05-16 17:43:04.000 EDT
INFO:     169.254.169.126:31991 - "POST https://backend-service-rojjrgeqna-ue.a.run.app/api/blog/posts_fetch/ HTTP/1.1" 301 OK
2024-05-16 17:43:07.000 EDT
POST 4.55 KB 2.6 s Edge 44 https://backend-service-rojjrgeqna-ue.a.run.app/api/blog/feed_data/
2024-05-16 17:43:07.000 EDT
INFO:     169.254.169.126:14033 - "POST https://backend-service-rojjrgeqna-ue.a.run.app/api/blog/feed_data/ HTTP/1.1" 301 OK
2024-05-16 17:43:09.000 EDT
GET 35.02 KB 6 ms Chrome 125 https://backend-service-rojjrgeqna-ue.a.run.app/api/blog/posts_fetch/
2024-05-16 17:43:09.000 EDT
INFO:     169.254.169.126:25855 - "GET https://backend-service-rojjrgeqna-ue.a.run.app/api/blog/posts_fetch/ HTTP/1.1" 301 OK
    "#;

    let processed_logs = process_logs(log_entries);
    println!("Processed Logs:\n{}", processed_logs);
}
