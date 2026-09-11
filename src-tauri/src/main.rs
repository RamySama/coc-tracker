// évite l'ouverture d'une console derrière la fenêtre sur Windows en release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_google_auth::init())
        .run(tauri::generate_context!())
        .expect("erreur au lancement de l'application Tauri");
}
