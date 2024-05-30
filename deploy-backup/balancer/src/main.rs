use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use reqwest::Client;

async fn distribute_request(client: web::Data<Client>, req_body: web::Bytes) -> impl Responder {
    // Example list of worker node URLs
    let workers = vec![
        "http://127.0.0.1:8081/compute",
    ];

    // Simple round-robin load balancing
    static mut NEXT_WORKER: usize = 0;
    let worker_url;
    unsafe {
        worker_url = workers[NEXT_WORKER].to_string();
        NEXT_WORKER = (NEXT_WORKER + 1) % workers.len();
    }

    let response = client
        .post(&worker_url)
        .body(req_body)
        .send()
        .await
        .expect("Failed to send request");

    let response_body = response
        .text()
        .await
        .expect("Failed to read response body");

    HttpResponse::Ok().body(response_body)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let client = Client::new();

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(client.clone()))
            .route("/compute", web::post().to(distribute_request))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
