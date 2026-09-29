mod now_playing;
mod wow_api;
mod youtube;

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, LogicalSize, Manager, WindowEvent,
};

/// 창 크기: 플레이어만 / 플레이어 + 오른쪽 창(사연·다시듣기·편성표) / 미니 바
const PLAYER_SIZE: (f64, f64) = (400.0, 560.0);
const WIDE_SIZE: (f64, f64) = (780.0, 560.0);
const MINI_SIZE: (f64, f64) = (380.0, 72.0);

#[tauri::command]
async fn now_playing(url: String) -> Result<Option<String>, String> {
    now_playing::fetch_stream_title(&url).await
}

/// 창 모드 전환. 미니 모드일 때만 "항상 위에 표시"를 적용한다.
#[tauri::command]
fn set_window_mode(app: AppHandle, mode: String, always_on_top: bool) -> Result<(), String> {
    let win = app.get_webview_window("main").ok_or("no main window")?;
    let (w, h) = match mode.as_str() {
        "mini" => MINI_SIZE,
        "player" => PLAYER_SIZE,
        _ => WIDE_SIZE,
    };
    win.set_size(LogicalSize::new(w, h)).map_err(|e| e.to_string())?;
    win.set_always_on_top(mode == "mini" && always_on_top)
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// 닫기 버튼: 종료하지 않고 트레이로 숨긴다. 방송은 계속 나온다.
#[tauri::command]
fn hide_to_tray(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.hide();
    }
}

fn show_main(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        // 두 번 실행하면 새 창 대신 기존 창을 보여준다
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main(app);
        }))
        .plugin(tauri_plugin_opener::init())
        // 자동 업데이트: GitHub Releases의 latest.json을 보고 새 버전을 받아 설치한 뒤 다시 실행
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            now_playing,
            wow_api::wow_get,
            wow_api::wow_post_request,
            youtube::youtube_live,
            set_window_mode,
            hide_to_tray
        ])
        .setup(|app| {
            let toggle = MenuItem::with_id(app, "toggle", "재생 / 정지", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "플레이어 열기", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let menu = Menu::with_items(app, &[&toggle, &show, &sep, &quit])?;

            TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("WOWCCM 24시간 찬양방송")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle" => {
                        let _ = app.emit("tray-toggle", ());
                    }
                    "show" => show_main(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main(tray.app_handle());
                    }
                })
                .build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            // Alt+F4, Cmd+W 등으로 닫아도 트레이로 숨김
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app, _event| {
        // macOS: Dock 아이콘을 누르면 숨겨둔 창을 다시 보여준다
        #[cfg(target_os = "macos")]
        if let tauri::RunEvent::Reopen { .. } = _event {
            show_main(_app);
        }
    });
}
