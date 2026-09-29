//! wowccm.net 서버 데이터(프로그램, 곡, DJ 이미지, 사연, 다시듣기, 편성표)를 가져온다.
//! 서버가 CORS 헤더를 주지 않아 화면(웹뷰)에서 직접 부를 수 없으므로 여기서 대신 요청한다.

use std::sync::OnceLock;
use std::time::Duration;

const BASE: &str = "https://wowccm.net";
/// 사연 등록을 받는 주소 (미니 페이지와 같은 곳)
const REQUEST_WRITE_PATH: &str = "/wowcast/wow_mini_test_v2.php";

fn client() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .timeout(Duration::from_secs(10))
            .cookie_store(true)
            .user_agent("WOWCCM-Player/2.0")
            .build()
            .expect("http client")
    })
}

/// 다른 사이트로 요청이 새지 않도록 wowccm.net 안의 경로만 허용한다.
fn url_for(path: &str) -> Result<String, String> {
    if !path.starts_with('/') || path.starts_with("//") || path.contains('@') {
        return Err("잘못된 경로입니다".into());
    }
    Ok(format!("{BASE}{path}"))
}

async fn text_of(res: reqwest::Response) -> Result<String, String> {
    let status = res.status();
    if !status.is_success() {
        return Err(format!("서버 응답 오류 ({status})"));
    }
    res.text().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn wow_get(path: String) -> Result<String, String> {
    let res = client()
        .get(url_for(&path)?)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    text_of(res).await
}

#[tauri::command]
pub async fn wow_post_request(name: String, content: String) -> Result<String, String> {
    let res = client()
        .post(url_for(REQUEST_WRITE_PATH)?)
        .form(&[
            ("mini_request_action", "write"),
            ("wr_name", name.trim()),
            ("wr_content", content.trim()),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;
    text_of(res).await
}

#[cfg(test)]
mod tests {
    use super::url_for;

    #[test]
    fn only_site_paths_allowed() {
        assert_eq!(
            url_for("/daeil/music5.php?song_check=1").unwrap(),
            "https://wowccm.net/daeil/music5.php?song_check=1"
        );
        assert!(url_for("//evil.com/x").is_err());
        assert!(url_for("https://evil.com").is_err());
        assert!(url_for("@evil.com").is_err());
    }
}
