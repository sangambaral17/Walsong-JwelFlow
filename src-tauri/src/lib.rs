#[cfg_attr(mobile, tauri::mobile_entry_point)]

use serde::Serialize;

#[derive(Serialize)]
struct LiveRates {
    hallmark_gold: f64,
    tejabi_gold: f64,
    silver: f64,
    source: String,
    timestamp: String,
}

#[tauri::command]
async fn fetch_live_rates() -> Result<LiveRates, String> {
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true) // FENEGOSIDA has cert issues on www subdomain
        .timeout(std::time::Duration::from_secs(15)) // 15-second hard timeout
        .connect_timeout(std::time::Duration::from_secs(10)) // 10-second connect timeout
        .build()
        .map_err(|e| format!("HTTP client error: {}", e))?;

    let response = client
        .get("https://fenegosida.org/")
        .header("User-Agent", "JwelFlow/1.0")
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    let body = response.text().await.map_err(|e| format!("Read error: {}", e))?;

    // Parse rates from HTML using (?si) flag for multiline matching.
    // IMPORTANT: The page lists rates TWICE: per 10 grm, then per 1 tola.
    // We must NOT let the SILVER regex cross from the 10grm section past GOLD entries.
    // Format:
    //   FINE GOLD (9999)per 1 tolaरु 314900
    //   TEJABI GOLDper 1 tolaरु 0
    //   SILVERper 1 tolaरु 5740
    //
    // For GOLD/TEJABI: [^]* is fine because they appear before SILVER
    // For SILVER: use tight anchor "SILVER\s*per 1 tola" to avoid crossing entries
    let re_gold = regex::Regex::new(r"(?si)FINE\s*GOLD.*?per\s*1\s*tola\D{0,20}(\d[\d,]+)")
        .map_err(|e| format!("Regex error: {}", e))?;
    let re_tejabi = regex::Regex::new(r"(?si)TEJABI\s*GOLD.*?per\s*1\s*tola\D{0,20}(\d[\d,]+)")
        .map_err(|e| format!("Regex error: {}", e))?;
    let re_silver = regex::Regex::new(r"(?i)SILVER\s*per\s*1\s*tola\D{0,20}(\d[\d,]+)")
        .map_err(|e| format!("Regex error: {}", e))?;

    let parse_rate = |re: &regex::Regex, html: &str| -> f64 {
        re.captures(html)
            .and_then(|c| c.get(1))
            .and_then(|m| m.as_str().replace(",", "").parse::<f64>().ok())
            .unwrap_or(0.0)
    };

    let hallmark = parse_rate(&re_gold, &body);
    let tejabi = parse_rate(&re_tejabi, &body);
    let silver = parse_rate(&re_silver, &body);

    // Tolerate partial success: as long as gold OR silver parsed, return what we have
    if hallmark == 0.0 && silver == 0.0 {
        return Err("Could not parse any rates from FENEGOSIDA".into());
    }

    Ok(LiveRates {
        hallmark_gold: hallmark,
        tejabi_gold: if tejabi > 0.0 { tejabi } else { hallmark }, // fallback tejabi to hallmark
        silver,
        source: "FENEGOSIDA".into(),
        timestamp: chrono::Local::now().to_rfc3339(),
    })
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![fetch_live_rates])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
