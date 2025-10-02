const MAX_TRIES = 10;

const input = document.querySelector('#input');
const form = document.querySelector('#form');
const logs = document.querySelector('#logs');
const inputEl  = document.getElementById('input');
const submitBtn = document.querySelector('#form button');
const submitBtn2 = form.querySelector('button[type="submit"]');

const answer = new Set();

while(answer.size < 4) {
    const randomNum = Math.floor(Math.random() * 9) + 1;
    answer.add(randomNum);
}

const answerArray = Array.from(answer);
console.log(answerArray);

//====================================================
// 배경 이미지 관리
//====================================================

function setBackgroundByResult(ok) {
  document.body.classList.toggle('bg-correct', !!ok);
  document.body.classList.toggle('bg-wrong', !ok);
}

// 시작 시 기본 배경: 오답(Wrong)
setBackgroundByResult(false);

//====================================================
// 입력창 제어
//====================================================  

function lockInput() {
  inputEl.disabled = true;
  submitBtn.disabled = true;
}

function unlockInput() {
  inputEl.disabled = false;
  submitBtn.disabled = false;
  inputEl.focus();
}

//====================================================
// 게임 재시작
//====================================================  

function showRestart() {
  const form = document.getElementById('form');
  if (!form) return console.error('#form not found');

  // input, 제출 버튼을 현재 DOM에서 다시 안전하게 가져오기
  const inputEl   = document.getElementById('input');
  const submitBtn = form.querySelector('button[type="submit"], button:not(#restart)');

  form.classList.add('ended');
  if (inputEl)   inputEl.disabled   = true;
  if (submitBtn) submitBtn.disabled = true;

  // 재시작 버튼 보장
  let restartBtn = document.getElementById('restart');
  if (!restartBtn) {
    restartBtn = document.createElement('button');
    restartBtn.id = 'restart';
    restartBtn.type = 'button';
    restartBtn.textContent = '다시 시작';
    form.appendChild(restartBtn);
  }

  restartBtn.onclick = () => location.reload();
}


//====================================================
// 게임 상태 관리
//====================================================

const tries = [];

//====================================================
// 입력값 검증 함수
//====================================================
function checkInput(input) {
    if(!/^\d+$/.test(input)) {
        return alert("숫자를 입력해주세요.")
    }
    if(input.length !== 4) {
        return alert("4자리 숫자를 입력해주세요.")
    }
    if(new Set(input).size !== 4) {
        return alert("중복된 숫자가 있습니다.")
    }
    if(tries.includes(input)) {
        return alert("이미 시도한 숫자입니다.")
    }
    return true;
}

//====================================================
// 남은 시도 횟수 업데이트 함수
//====================================================

// 남은 횟수 갱신
function updateTriesLeft() {
  const left = Math.max(0, MAX_TRIES - tries.length);
  logs.setAttribute('data-tries-left', left);
}
updateTriesLeft(); // 초기 표시

//====================================================
// 메인 게임 로직 - 폼 제출 이벤트 처리
//====================================================

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const value = input.value;
    input.value = '';

    const valid = checkInput(value);
    if(!valid) return;

    //=================================================
    // 정답 확인
    //=================================================

    if(answerArray.join('') === value) {
        let used = tries.length + 1;
        logs.textContent = `홈런! ${used}번 만에 맞췄습니다. `;
        lockInput();
        showRestart();
        setBackgroundByResult(true);
        tries.push(value);        // 성공 시도도 1회로 치려면 유지, 아니면 제거
        updateTriesLeft();
        return;
    }

    //=================================================
    // 게임 오버 조건 확인
    //=================================================

    if(tries.length >= 9 ) {
        const message = document.createTextNode(`패배! 정답은 ${answerArray.join('')}입니다.`);
        logs.appendChild(message);
        showRestart();
        updateTriesLeft();
        return;
    }

    //=================================================
    // 스트라이크와 볼 계산
    //=================================================

    let strike = 0;
    let ball = 0;

    for(let i = 0; i < answerArray.length; i++ ) {
        const index = value.indexOf(answerArray[i]);

        if(index > -1) {
            if(index === i) {
                strike++;
            } else {
                ball++;
            }
        }
    }

    //=================================================
    // 결과 표시 및 게임 상태 업데이트
    //=================================================

    logs.append(`${value}: ${strike}스트라이크 ${ball}볼`, document.createElement('br'));
    tries.push(value);
    updateTriesLeft();
});

// ================================
// 메모장 기능
// ================================
(() => {
  const LS_KEY = 'nb_memo_v1';

  const $ = (sel) => document.querySelector(sel);
  const memo = $('#memo-text');
  const clearBtn = $('#memo-clear');
  const copyBtn = $('#memo-copy');
  const dlBtn = $('#memo-download');
  const upInput = $('#memo-upload');
  const status = $('#memo-status');

  if (!memo) return; // 메모장 없으면 무시

  // 초기 로드
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved !== null) memo.value = saved;
  } catch (e) { /* private mode 등 예외 무시 */ }

  // 상태 메시지 헬퍼
  let statusTimer;
  function showStatus(msg) {
    clearTimeout(statusTimer);
    status.textContent = msg;
    statusTimer = setTimeout(() => (status.textContent = ''), 1500);
  }

  // 디바운스 자동저장
  let t;
  memo.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY, memo.value);
        showStatus('자동 저장됨');
      } catch (e) {
        showStatus('저장 실패(스토리지 제한)');
      }
    }, 400);
  });

  // 지우기
  clearBtn?.addEventListener('click', () => {
    if (!memo.value) return;
    if (!confirm('메모를 모두 지울까요?')) return;
    memo.value = '';
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    showStatus('지웠습니다');
  });

  // 복사
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(memo.value || '');
      showStatus('클립보드로 복사됨');
    } catch (e) {
      showStatus('복사 실패');
    }
  });

  // 다운로드(.txt)
  dlBtn?.addEventListener('click', () => {
    const blob = new Blob([memo.value || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `메모-${ts}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showStatus('다운로드 시작');
  });

  // 불러오기(.txt)
  upInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    memo.value = text;
    try { localStorage.setItem(LS_KEY, memo.value); } catch (e) {}
    showStatus('불러오기 완료');
    upInput.value = '';
  });
})();
