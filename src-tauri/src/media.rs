//! Windows 볼륨 팝업·미디어 키 연동 (시스템 미디어 컨트롤, SMTC)
//!
//! Windows 앱 화면(WebView2)은 이 기능을 스스로 하지 않으므로 앱이 직접 맡는다.
//! Mac은 화면 쪽 navigator.mediaSession이 제어 센터에 표시하므로 여기서는 아무것도 하지 않는다.

use tauri::AppHandle;

#[cfg(windows)]
mod imp {
    use souvlaki::{MediaControlEvent, MediaControls, MediaMetadata, MediaPlayback, PlatformConfig};
    use std::sync::Mutex;
    use tauri::{AppHandle, Emitter, Manager};

    pub struct State(pub Mutex<Option<MediaControls>>);

    pub fn setup(app: &AppHandle) {
        let Some(win) = app.get_webview_window("main") else { return };
        let Ok(hwnd) = win.hwnd() else { return };
        let config = PlatformConfig {
            display_name: "WOWCCM 와플",
            dbus_name: "wowccm_wapl",
            hwnd: Some(hwnd.0 as *mut std::ffi::c_void),
        };
        let Ok(mut controls) = MediaControls::new(config) else { return };
        let handle = app.clone();
        let attached = controls.attach(move |event| {
            let action = match event {
                MediaControlEvent::Play => "play",
                MediaControlEvent::Pause => "pause",
                MediaControlEvent::Toggle => "toggle",
                MediaControlEvent::Stop => "stop",
                _ => return,
            };
            let _ = handle.emit("media-control", action);
        });
        if attached.is_ok() {
            app.manage(State(Mutex::new(Some(controls))));
        }
    }

    pub fn update(app: &AppHandle, title: &str, artist: &str, cover: Option<&str>, playing: bool) -> Result<(), String> {
        let Some(state) = app.try_state::<State>() else { return Ok(()) };
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        let Some(controls) = guard.as_mut() else { return Ok(()) };
        controls
            .set_metadata(MediaMetadata {
                title: Some(title),
                artist: Some(artist),
                album: Some("WOWCCM 와플"),
                cover_url: cover.filter(|c| c.starts_with("https://") || c.starts_with("http://")),
                duration: None,
            })
            .map_err(|e| format!("{e:?}"))?;
        // 생방송은 정지해도 "일시정지"로 두어야 볼륨 팝업에서 다시 재생 버튼을 누를 수 있다
        let playback = if playing {
            MediaPlayback::Playing { progress: None }
        } else {
            MediaPlayback::Paused { progress: None }
        };
        controls.set_playback(playback).map_err(|e| format!("{e:?}"))
    }
}

/// 앱을 띄운 뒤 한 번 부른다
pub fn setup(_app: &AppHandle) {
    #[cfg(windows)]
    imp::setup(_app);
}

/// 곡 정보·재생 상태가 바뀔 때마다 화면 쪽에서 부른다
#[tauri::command]
#[cfg_attr(not(windows), allow(unused_variables))]
pub fn media_update(
    app: AppHandle,
    title: String,
    artist: String,
    cover: Option<String>,
    playing: bool,
) -> Result<(), String> {
    #[cfg(windows)]
    return imp::update(&app, &title, &artist, cover.as_deref(), playing);
    #[cfg(not(windows))]
    Ok(())
}
