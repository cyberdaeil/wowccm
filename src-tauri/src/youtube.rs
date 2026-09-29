//! 유튜브 채널이 지금 라이브(보이는 방송) 중인지 확인한다.
//! 채널의 /live 주소는 방송 중일 때만 그 영상 페이지를 보여 주고,
//! 페이지 안에 "isLiveNow":true 가 들어 있다. 예약된 방송(isUpcoming)은 라이브로 보지 않는다.

use serde::Serialize;
use std::time::Duration;

const CHANNEL_LIVE_URL: &str = "https://www.youtube.com/@wowccm/live";

#[derive(Serialize, Debug, PartialEq)]
pub struct LiveStatus {
    pub live: bool,
    /// 라이브 중이면 그 영상 주소
    pub url: Option<String>,
}

#[tauri::command]
pub async fn youtube_live() -> Result<LiveStatus, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .user_agent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 \
             (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        )
        .build()
        .map_err(|e| e.to_string())?;
    let res = client
        .get(CHANNEL_LIVE_URL)
        .header("Accept-Language", "ko-KR,ko;q=0.9")
        // 유럽 등에서 뜨는 쿠키 동의 화면을 건너뛴다
        .header("Cookie", "CONSENT=YES+1; SOCS=CAI")
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("유튜브 응답 오류 ({})", res.status()));
    }
    let html = res.text().await.map_err(|e| e.to_string())?;
    parse_live(&html).ok_or_else(|| "유튜브 페이지를 해석하지 못했습니다".into())
}

/// 유튜브 페이지가 아닌 것(동의 화면 등)이면 None
fn parse_live(html: &str) -> Option<LiveStatus> {
    if !html.contains("ytInitialData") && !html.contains("ytInitialPlayerResponse") {
        return None;
    }
    let watch_url = canonical(html).filter(|u| u.contains("/watch?v="));
    let live_now = html.contains("\"isLiveNow\":true");
    Some(match watch_url {
        Some(url) if live_now => LiveStatus {
            live: true,
            url: Some(url),
        },
        _ => LiveStatus {
            live: false,
            url: None,
        },
    })
}

fn canonical(html: &str) -> Option<String> {
    let key = "<link rel=\"canonical\" href=\"";
    let start = html.find(key)? + key.len();
    let end = html[start..].find('"')?;
    Some(html[start..start + end].to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    const PAGE: &str = "<html><script>var ytInitialPlayerResponse = {};</script>";

    #[test]
    fn live_now() {
        let html = format!(
            "{PAGE}<link rel=\"canonical\" href=\"https://www.youtube.com/watch?v=abc123\">\
             {{\"isLiveNow\":true}}"
        );
        assert_eq!(
            parse_live(&html),
            Some(LiveStatus {
                live: true,
                url: Some("https://www.youtube.com/watch?v=abc123".into())
            })
        );
    }

    #[test]
    fn upcoming_is_not_live() {
        let html = format!(
            "{PAGE}<link rel=\"canonical\" href=\"https://www.youtube.com/watch?v=abc123\">\
             {{\"isLiveNow\":false,\"isUpcoming\":true}}"
        );
        assert!(!parse_live(&html).unwrap().live);
    }

    #[test]
    fn channel_page_is_not_live() {
        let html = format!(
            "{PAGE}<link rel=\"canonical\" href=\"https://www.youtube.com/channel/UCxyz\">"
        );
        assert!(!parse_live(&html).unwrap().live);
    }

    #[test]
    fn consent_page_is_unknown() {
        assert_eq!(parse_live("<html>Before you continue to YouTube</html>"), None);
    }
}
