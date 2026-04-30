
// FIGMA_URL: https://www.figma.com/design/ZytKptNXL0wH5qrvip41zR/%EC%B0%BD%EB%8F%99_UI%EC%A0%9C%EC%9E%91?node-id=129-1553
// Figma 디자인 시스템 기반, 기능적 코드 없이 스타일/구조만 구현

const imgEllipse76 = "http://localhost:3845/assets/551c787531f595d9fae52ce2a40b57ad41534f64.png";
const imgEllipse77 = "http://localhost:3845/assets/e2330ac764237fd95151ef1d8adec0061f08911b.png";
const imgEllipse78 = "http://localhost:3845/assets/2799bfef5f40d5c3612f08c931c16842bebe2af3.png";
const imgEllipse80 = "http://localhost:3845/assets/1a15fd73e333ba81f9539df04ece1ef141c5fca2.png";
const imgEllipse81 = "http://localhost:3845/assets/7a9f3a0625f86d9ebd8e4a2efb05b08f6960bc89.png";
const imgEllipse83 = "http://localhost:3845/assets/d6534c3a35e7a2554d01b611625ef8dde6b1e0f2.png";
const imgEllipse85 = "http://localhost:3845/assets/ad54a972f5cbb8c19ad02fed9f9d25c1c873eaa9.png";
const imgEllipse82 = "http://localhost:3845/assets/da9ab7de85890062dd42745a9b202375e329b982.png";
const imgEllipse94 = "http://localhost:3845/assets/3c184982dca75d061e0326cdeaf9081a20e99ddc.png";
const imgEllipse95 = "http://localhost:3845/assets/8c4069347b5a27b63ec949f04424dc769ef65e41.png";
const imgEllipse99 = "http://localhost:3845/assets/a24171399770d93aa28a4e6b19c8ffc0c79e6273.png";
const imgEllipse100 = "http://localhost:3845/assets/32e55a2bf4fb20af8916ab7f726b6dda035c938b.png";
const imgNotch = "http://localhost:3845/assets/524658ebef1b6909df434f4c577c311e463f23ea.svg";
const imgRightSide = "http://localhost:3845/assets/146378ef912739f12dcd159d4bb738032e22c1ec.svg";
const imgEllipse87 = "http://localhost:3845/assets/c0d6e629c9c988ca92900e4b0a28fe691093c9fd.svg";
const imgEllipse88 = "http://localhost:3845/assets/03dd29e0ff03ee95a513f8d27473a5caef39b3d1.svg";
const imgEllipse90 = "http://localhost:3845/assets/498d3bbca4546b5b367bfe5959cf722ed93db6e0.svg";
const imgEllipse92 = "http://localhost:3845/assets/0459089549df5be4673b761afad9325637af0e43.svg";
const imgEllipse91 = "http://localhost:3845/assets/776c9927374d9e998d57fff859cfd4aedac5ea2b.svg";
const imgEllipse89 = "http://localhost:3845/assets/aacda8aaacf97cdc7e312344664aa97e819aa47e.svg";
const imgEllipse58 = "http://localhost:3845/assets/e1a3cc2fb28ce873f24fc6d055a2a13f20e36804.svg";
const imgEllipse59 = "http://localhost:3845/assets/f2432a767192ca9ec80584dcb90c5ad1dbdc27d4.svg";
const imgEllipse79 = "http://localhost:3845/assets/4408acc4449c0379d071ab27b42f18e05de6f9e8.svg";
const imgEllipse84 = "http://localhost:3845/assets/8d46788732eba30a6746e07fe295b7dc953bce52.svg";
const imgVector = "http://localhost:3845/assets/17b90505518a32bba5b73a5b1f1f8677173e2d0b.svg";
const imgVector1 = "http://localhost:3845/assets/a6c31a3c6a4878c58e7b70069a537ce177a270d3.svg";
const imgVector2 = "http://localhost:3845/assets/c9115435e2b386c2bdec5f4ed4dd4c5587bca327.svg";
const imgEllipse93 = "http://localhost:3845/assets/61f5c6a6d25b7f961f05aab2b7f76b60f42843b3.svg";
const imgEllipse98 = "http://localhost:3845/assets/d0f5850f7b3a0ce561025ac5ea95c8577f193eb3.svg";
const imgEllipse86 = "http://localhost:3845/assets/774025e7a9c0ae17689396d908c72f7a1669fcc7.svg";
const imgEllipse96 = "http://localhost:3845/assets/42413b0650610cee32eee5b72ecd2ad06f4c8eb5.svg";
const imgMaskGroup = "http://localhost:3845/assets/1c7312e7c0af7df7e343d985c20e468b611ede59.svg";
const imgMaskGroup1 = "http://localhost:3845/assets/409d62c61008dada44bba1c326080b35127ce336.svg";

// HomeIndicator 컴포넌트 (피그마 스타일)
function HomeIndicator({ className, darkMode = false }: { className?: string; darkMode?: boolean }) {
  return (
    <div className={className || "h-[34px] relative w-[390px]"}>
      <div className={`-translate-x-1/2 absolute bottom-[8px] h-[5px] left-1/2 rounded-[100px] w-[134px] ${darkMode ? "bg-white" : "bg-black"}`} />
    </div>
  );
}

const Temp = () => {
  return (
    <div className="bg-[#121212] relative w-[390px] h-[844px] overflow-hidden" data-name="타임캡보관함화면">
      {/* StatusBar */}
      <div className="absolute h-[47px] left-0 top-0 w-[390px]">
        <div className="absolute h-[32px] left-1/2 top-[-2px] w-[164px] -translate-x-1/2">
          <img src={imgNotch} alt="notch" className="absolute block max-w-none w-full h-full" />
        </div>
        <div className="absolute h-[21px] left-[54px] top-[14px] rounded-[24px] w-[54px]">
          <p className="absolute font-['SF_Pro_Text:Semibold',sans-serif] h-[20px] leading-[22px] left-[27px] text-[17px] text-center text-white top-px tracking-[-0.408px] w-[54px]">9:41</p>
        </div>
        <div className="absolute h-[13px] left-[325px] top-[19px] w-[77px]">
          <img src={imgRightSide} alt="right" className="absolute block max-w-none w-full h-full" />
        </div>
      </div>
      {/* 상단 타이틀 */}
      <div className="-translate-x-1/2 absolute flex flex-col font-['Pretendard:Bold',sans-serif] justify-end leading-[0] left-1/2 not-italic text-[29.094px] text-center text-white top-[114.27px] tracking-[-0.5935px] whitespace-nowrap">
        <p className="leading-[32.004px]">저장된 타임캡슐 50개</p>
      </div>
      {/* 검색 바 */}
      <div className="-translate-x-1/2 absolute left-1/2 top-[131.25px] w-[317.116px]">
        <div className="absolute bg-[rgba(79,79,79,0.4)] h-[35.657px] rounded-[90px] w-full" />
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <img src={imgVector} alt="search" className="block max-w-none w-5 h-5" />
        </div>
        <p className="absolute left-10 top-1/2 -translate-y-1/2 font-['Pretendard:Regular',sans-serif] text-[#727272] text-[12px] whitespace-nowrap">찾고계신 타임캡슐 속 사진의 이름/특징을 말해주세요.</p>
      </div>
      {/* 오브 리스트 (중앙 원형 아이콘들) */}
      {/* ...중앙 원형 아이콘 및 이모지, 텍스트 등은 Figma 구조에 맞춰 추가 구현 필요... */}
      {/* 하단 탭바 및 홈 인디케이터 */}
      <div className="absolute left-0 bottom-0 w-full flex flex-col items-center">
        <div className="h-[50px] w-full" />
        <HomeIndicator className="h-[34px] w-full" darkMode />
      </div>
    </div>
  );
};

export default Temp;
