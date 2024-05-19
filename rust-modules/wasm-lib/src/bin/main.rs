/// wasm_data_processor::process_logs;
use wasm_data_processor::process_logs;

fn main() {
    let log_entries = "
    2024-05-20 12:34:56.789 EDT POST 200 \"Action completed\" https://example.com/api/data 192.168.1.25:5050
    2024-05-21 13:45:10.123 PDT GET 404 10.0.0.1:443 \"Resource not found\" https://example.com/login
    DELETE 192.168.100.100:80 2024-05-22 15:00:00.000 UTC https://example.net/resource 204 \"No Content\"
    OPTIONS 500 \"Server error\" 2024-05-23 08:15:30.250 IST 192.168.200.200:8080 https://example.org/settings
    PATCH https://example.com/api/update \"Unauthorized access\" 401 2024-05-25 19:20:47.145 CEST 172.16.0.3:1234
    2024-05-26 23:59:59.999 EST http://example.co.uk/path/to/resource?query=123 404 GET 192.168.1.50:80
    POST http://bad-url.com 500 \"Critical failure\" 2024-05-27 14:25:47.325 KST 10.1.1.1:443
    2024-05-28 03:30:00.000 BST 200 192.168.1.75:22 \"All good\" GET https://192.168.1.75/api/query
    ";

    let processed_logs = wasm_data_processor::process_logs(log_entries); // Using the full path
    println!("Processed Logs:\n{}", processed_logs);
}
