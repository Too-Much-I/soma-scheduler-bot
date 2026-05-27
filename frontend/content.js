// 1. 파일이 꽂히자마자 무조건 실행되는 생존 로그
console.log("👀 소마 확장 프로그램 content.js 정상 주입 완료!");

// 2. 화면 전체에 귀를 대고 있다가 버튼 클릭을 낚아채는 방식
document.addEventListener('click', async (e) => {
  // 클릭된 곳이 버튼이나 링크인지 확인
  const targetBtn = e.target.closest('button, a, input[type="button"]');
  
  if (!targetBtn) return; // 버튼이나 링크가 아니면 무시하고 지나감

  const btnText = targetBtn.innerText.trim();
  
  // 🕵️‍♂️ [디버깅용] 내가 방금 누른 버튼을 컴퓨터는 뭐라고 읽었을까?
  console.log("🖱️ 방금 클릭한 버튼의 텍스트는? : [" + btnText + "]");

  // -----------------------------------------
  // [A] '신청하기' 버튼을 눌렀을 때
  // -----------------------------------------
  if (btnText.includes('신청하기')) {
    console.log("🚀 신청하기 버튼 클릭 감지! 노션 전송 시작!");
    
    // 원래 페이지가 넘어가는 걸 잠깐 막음 (데이터 전송할 시간 벌기)
    e.preventDefault(); 
    
    // 데이터 스크래핑
    const data = scrapeData();
    console.log("긁어온 데이터:", data); // 콘솔에 데이터 확인용 출력

    try {
      // Replit 백엔드로 쏘기 (ADD)
      const response = await fetch("https://2e5998d0-caad-4b0f-8eb0-aee5286eb59d-00-3006re4lkei9x.sisko.replit.dev/api/mentoring/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        alert("✅ [자동화] 멘토링 일정이 노션 달력에 등록되었습니다!");
        // 알림창 확인 후 원래 페이지 이동을 시켜주려면 아래 주석 해제!
        // window.location.href = targetBtn.href; 
      } else {
        alert("❌ 서버 통신 완료, 그러나 노션 저장 실패 (Replit 로그 확인)");
      }
    } catch (error) {
      console.error("❌ 자동 전송 실패:", error);
      alert("❌ 자동 전송 실패! (네트워크 오류)");
    }
  }
  
  // -----------------------------------------
  // [B] '취소하기' 버튼을 눌렀을 때
  // -----------------------------------------
  else if (btnText.includes('취소하기') || btnText === '취소') { 
    console.log("🗑️ 취소하기 버튼 클릭 감지! 노션 일정 삭제 시작!");
    
    // 통신할 시간 벌기
    e.preventDefault(); 

    // 지울 멘토링의 제목을 알기 위해 화면 데이터를 한 번 더 긁어옴
    const data = scrapeData();
    console.log("삭제 요청할 멘토링 제목:", data.title);

    try {
      // Replit 백엔드로 쏘기 (DELETE)
      const response = await fetch("https://2e5998d0-caad-4b0f-8eb0-aee5286eb59d-00-3006re4lkei9x.sisko.replit.dev/api/mentoring/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: data.title }) // 제목만 보내서 휴지통으로!
      });
      
      if (response.ok) {
        alert("🗑️ [자동화] 노션 달력에서 해당 일정이 삭제되었습니다!");
        // window.location.href = targetBtn.href; 
      } else if (response.status === 404) {
        alert("⚠️ 노션에서 해당 일정을 찾을 수 없습니다. (이미 삭제되었을 수 있음)");
      } else {
        alert("❌ 서버 통신 완료, 그러나 노션 삭제 실패");
      }
    } catch (error) {
      console.error("❌ 삭제 통신 실패:", error);
      alert("❌ 자동 삭제 실패! (네트워크 오류)");
    }
  }
});

// -----------------------------------------
// 3. 웹페이지에서 데이터를 긁어오는 스크래핑 함수
// -----------------------------------------
function scrapeData() {
  try {
    // 제목 가져오기
    const cElements = document.querySelectorAll('.bbs-view-new .c');
    const titleText = cElements.length > 0 ? cElements[0].innerText.trim() : document.title;
    
    // 진행 방식 가져오기
    let typeText = "방식 정보 없음";
    const tElements = document.querySelectorAll('.t');
    for (let i = 0; i < tElements.length; i++) {
      if (tElements[i].innerText.trim() === "진행방식") {
        let nextEl = tElements[i].nextElementSibling;
        if (nextEl && nextEl.classList.contains('c')) {
          typeText = nextEl.innerText.trim();
        }
        break;
      }
    }

    // 날짜 가져오기
    let dateText = "일시 정보 없음";
    const dateSpan = document.querySelector('.eventDt');
    if (dateSpan && dateSpan.parentNode) {
      dateText = dateSpan.parentNode.innerText.replace(/\s+/g, ' ').trim();
    }

    return { title: titleText, date: dateText, type: typeText };
  } catch (error) {
    return { title: "스크래핑 에러", date: "-", type: "-" };
  }
}