document.getElementById('sendBtn').addEventListener('click', async () => {
  const statusText = document.getElementById('status');
  statusText.innerText = "웹페이지 데이터 읽는 중... 🔍";

  // 1. 현재 활성화된 탭 찾기
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 2. 현재 탭에서 scrapeData 함수를 실행하여 데이터 긁어오기
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeData,
  }, async (injectionResults) => {
    const data = injectionResults[0].result;

    statusText.innerText = "서버로 전송 중... 🚀";

    try {
      // 3. Replit 백엔드 서버로 데이터 쏘기 (★ 네 리플릿 주소로 반드시 변경!)
      const response = await fetch("https://2e5998d0-caad-4b0f-8eb0-aee5286eb59d-00-3006re4lkei9x.sisko.replit.dev/api/mentoring/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        statusText.innerText = "✅ 노션 등록 성공!";
      } else {
        statusText.innerText = "❌ 서버 에러 발생";
      }
    } catch (error) {
      statusText.innerText = "❌ 통신 실패: " + error.message;
    }
  });
});

// --- 👇 이 함수는 현재 보고 있는 웹페이지(소마 사이트) 안에서 실행됨 ---
function scrapeData() {
  try {
    // 1. .bbs-view-new 안에 있는 .c 클래스를 '전부 다(All)' 찾아서 배열로 만듦!
    const cElements = document.querySelectorAll('.bbs-view-new .c');
    
    // 첫 번째[0] .c는 '제목'
    const titleText = cElements.length > 0 ? cElements[0].innerText.trim() : document.title;
    
    // 2. 진행 방식은 '순서'가 아니라 '진행방식'이라는 이름표(.t)를 찾아서 그 짝꿍을 가져오기!
    let typeText = "방식 정보 없음";
    const tElements = document.querySelectorAll('.t'); // 모든 <strong> 이름표들을 다 찾음
    
    for (let i = 0; i < tElements.length; i++) {
      if (tElements[i].innerText.trim() === "진행방식") {
        // 이름표가 '진행방식'인 걸 찾았다면, 바로 다음 태그(nextElementSibling)가 우리가 찾는 값!
        let nextEl = tElements[i].nextElementSibling;
        if (nextEl && nextEl.classList.contains('c')) {
          typeText = nextEl.innerText.trim();
        }
        break; // 찾았으니 더 이상 찾을 필요 없이 반복문 탈출!
      }
    }

    // 2. 날짜와 시간은 부모 태그를 이용해 한방에 가져오기
    let dateText = "일시 정보 없음";
    const dateSpan = document.querySelector('.eventDt');
    if (dateSpan && dateSpan.parentNode) {
      // 부모 태그의 글자를 가져온 뒤, 지저분한 공백(&nbsp;)과 줄바꿈을 띄어쓰기 하나로 깔끔하게 정리
      dateText = dateSpan.parentNode.innerText.replace(/\s+/g, ' ').trim();
    }

    return {
      title: titleText,
      date: dateText,
      type: typeText
    };
  } catch (error) {
    return { title: "스크래핑 에러", date: "-", type: "-" };
  }
}