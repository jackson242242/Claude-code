'use client';

type GameOverScreenProps = {
  airlineName: string;
  onRestart: () => void;
};

export const GameOverScreen = ({ airlineName, onRestart }: GameOverScreenProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur"
    role="dialog"
    aria-modal="true"
    aria-label="游戏结束"
  >
    <div className="panel mx-4 w-full max-w-sm p-6 text-center">
      <p className="text-4xl">🛬</p>
      <h2 className="mt-3 text-xl font-bold text-red-400">破产清算</h2>
      <p className="mt-2 text-sm text-slate-400">
        {airlineName} 连续两个季度现金为负，已进入破产清算。航空帝国之路就此中断。
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="btn-primary mt-5 w-full px-4 py-3 text-sm"
      >
        重新开始
      </button>
    </div>
  </div>
);
