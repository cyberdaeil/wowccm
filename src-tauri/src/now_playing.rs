//! 스트림에 섞여 오는 ICY 메타데이터(StreamTitle)에서 현재 곡 정보를 읽는다.
//! 웹뷰의 <audio>는 이 정보를 넘겨주지 않으므로, 짧게 따로 접속해서 한 블록만 읽고 끊는다.

use std::time::Duration;

const MAX_METAINT: usize = 512 * 1024;

pub async fn fetch_stream_title(url: &str) -> Result<Option<String>, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .user_agent("WOWCCM-Player/2.0")
        .build()
        .map_err(|e| e.to_string())?;

    let mut res = client
        .get(url)
        .header("Icy-MetaData", "1")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let metaint: usize = match res
        .headers()
        .get("icy-metaint")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.trim().parse().ok())
    {
        Some(n) if n > 0 && n <= MAX_METAINT => n,
        _ => return Ok(None), // 서버가 메타데이터를 주지 않음
    };

    // 오디오 metaint 바이트 + 길이 1바이트 + 메타데이터(최대 255*16)
    let mut buf: Vec<u8> = Vec::with_capacity(metaint + 4096);
    loop {
        if buf.len() > metaint {
            let meta_len = buf[metaint] as usize * 16;
            if buf.len() >= metaint + 1 + meta_len {
                let meta = &buf[metaint + 1..metaint + 1 + meta_len];
                return Ok(parse_stream_title(meta));
            }
        }
        match res.chunk().await.map_err(|e| e.to_string())? {
            Some(chunk) => buf.extend_from_slice(&chunk),
            None => return Ok(None),
        }
    }
}

fn parse_stream_title(meta: &[u8]) -> Option<String> {
    let end = meta.iter().position(|&b| b == 0).unwrap_or(meta.len());
    let text = decode(&meta[..end]);
    let start = text.find("StreamTitle='")? + "StreamTitle='".len();
    let rest = &text[start..];
    let stop = rest.find("';").unwrap_or(rest.len());
    let title = rest[..stop].trim();
    if title.is_empty() {
        None
    } else {
        Some(title.to_string())
    }
}

/// UTF-8이 아니면 국내 송출 프로그램에서 흔한 EUC-KR(CP949)로 해석한다.
fn decode(bytes: &[u8]) -> String {
    match std::str::from_utf8(bytes) {
        Ok(s) => s.to_string(),
        Err(_) => encoding_rs::EUC_KR.decode(bytes).0.into_owned(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_utf8_title() {
        let meta = b"StreamTitle='Companion - WELOVE';StreamUrl='';\0\0\0";
        assert_eq!(
            parse_stream_title(meta).as_deref(),
            Some("Companion - WELOVE")
        );
    }

    #[test]
    fn parses_euc_kr_title() {
        let (encoded, _, _) = encoding_rs::EUC_KR.encode("StreamTitle='주 품에 - 어노인팅';");
        assert_eq!(
            parse_stream_title(&encoded).as_deref(),
            Some("주 품에 - 어노인팅")
        );
    }

    /// 가짜 ICY 서버를 띄워 실제 접속-읽기 과정을 끝까지 확인한다.
    #[tokio::test]
    async fn reads_title_from_icy_stream() {
        use std::io::{Read, Write};
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let addr = listener.local_addr().unwrap();
        std::thread::spawn(move || {
            let (mut sock, _) = listener.accept().unwrap();
            let mut req = [0u8; 1024];
            let _ = sock.read(&mut req);
            let metaint = 1000;
            let mut meta = b"StreamTitle='Companion - WELOVE';".to_vec();
            meta.resize(meta.len().div_ceil(16) * 16, 0);
            let mut body = vec![0u8; metaint];
            body.push((meta.len() / 16) as u8);
            body.extend_from_slice(&meta);
            body.extend_from_slice(&[0u8; 500]);
            let head = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: audio/mpeg\r\nicy-metaint: {metaint}\r\nContent-Length: {}\r\n\r\n",
                body.len()
            );
            sock.write_all(head.as_bytes()).unwrap();
            sock.write_all(&body).unwrap();
        });
        let title = fetch_stream_title(&format!("http://{addr}/live.mp3"))
            .await
            .unwrap();
        assert_eq!(title.as_deref(), Some("Companion - WELOVE"));
    }

    #[test]
    fn empty_title_is_none() {
        assert_eq!(parse_stream_title(b"StreamTitle='';"), None);
    }
}
