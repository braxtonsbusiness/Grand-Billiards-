import './styles.css';
import { firebaseService } from './services/firebaseService.js';
import { RewardedAdService } from './services/rewardedAdService.js';
import { EightBallGame } from './game/EightBallGame.js';

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="shell">
    <section class="hero panel">
      <div>
        <p class="eyebrow">Grand Billiards Presents</p>
        <h1>Luxury 8 Ball Pool Hall</h1>
        <p class="tagline">Black velvet rails, gold trim, rewarded boosts, Firebase-ready profiles, and end-match prize draws.</p>
      </div>
      <div class="wallet-card">
        <span>Reward Wallet</span>
        <strong id="walletBalance">$0.00</strong>
        <small>Cash-out requests are stored for admin review.</small>
      </div>
    </section>

    <section class="hud panel">
      <div><span>Player</span><strong id="playerName">Guest Hustler</strong></div>
      <div><span>Ball in hand</span><strong id="ballInHandCount">0</strong></div>
      <div><span>Aim longers</span><strong id="aimLongerCount">0</strong></div>
      <div><span>Match reward</span><strong id="matchReward">Watch ad to start</strong></div>
    </section>

    <section class="table-wrap panel">
      <canvas id="table" width="1100" height="620" aria-label="8 ball pool table"></canvas>
      <div class="controls">
        <button id="startMatch" class="primary">Watch Ad & Start Match</button>
        <button id="useBallInHand">Use Ball in Hand</button>
        <button id="buyBallInHand">Watch Ad for Ball in Hand</button>
        <button id="useAimLonger">Use Aim Longer</button>
        <button id="buyAimLonger">Watch Ad for Aim Longer</button>
      </div>
      <p class="hint" id="gameHint">Drag from the cue ball to aim, release to shoot. Clear balls 1-7 before sinking the 8. Every match is locked behind a rewarded ad.</p>
    </section>

    <section class="rewards panel">
      <div>
        <h2>Real Reward Requests</h2>
        <p>Players can request PayPal or Cash App payouts from approved wallet balances. Keep eligibility, tax, age, regional, and sweepstakes/gambling compliance rules in your Firebase admin workflow.</p>
      </div>
      <form id="cashoutForm">
        <select id="cashoutMethod" aria-label="Cash-out method">
          <option value="PayPal">PayPal</option>
          <option value="Cash App">Cash App</option>
        </select>
        <input id="cashoutHandle" placeholder="Email or $cashtag" required />
        <input id="cashoutAmount" type="number" min="1" step="0.01" placeholder="Amount" required />
        <button>Request payout</button>
      </form>
    </section>
  </main>

  <dialog id="adDialog" class="ad-dialog">
    <h2>Rewarded Ad Break</h2>
    <p id="adCopy">A premium sponsor unlocks your next reward.</p>
    <div class="ad-meter"><span id="adMeter"></span></div>
    <button id="completeAd" disabled>Collect Reward</button>
  </dialog>
`;

const state = {
  profile: { uid: crypto.randomUUID(), name: 'Guest Hustler', walletCents: 0, ballInHands: 0, aimLongers: 0 },
  activeMatch: false,
};

const ui = {
  walletBalance: document.querySelector('#walletBalance'),
  ballInHandCount: document.querySelector('#ballInHandCount'),
  aimLongerCount: document.querySelector('#aimLongerCount'),
  matchReward: document.querySelector('#matchReward'),
  hint: document.querySelector('#gameHint'),
};

const rewardedAds = new RewardedAdService({
  dialog: document.querySelector('#adDialog'),
  meter: document.querySelector('#adMeter'),
  completeButton: document.querySelector('#completeAd'),
  copy: document.querySelector('#adCopy'),
});

const game = new EightBallGame(document.querySelector('#table'), {
  onWin: async () => {
    state.activeMatch = false;
    const reward = drawEndMatchReward();
    await firebaseService.recordMatchResult(state.profile.uid, reward);
    render();
  },
  onMessage: (message) => { ui.hint.textContent = message; },
});

function render() {
  ui.walletBalance.textContent = `$${(state.profile.walletCents / 100).toFixed(2)}`;
  ui.ballInHandCount.textContent = state.profile.ballInHands;
  ui.aimLongerCount.textContent = state.profile.aimLongers;
}

function drawEndMatchReward() {
  const prize = Math.random();
  if (prize < 0.4) {
    state.profile.ballInHands += 3;
    ui.matchReward.textContent = '+3 ball in hands';
    firebaseService.saveProfile(state.profile);
    return { type: 'ballInHands', quantity: 3 };
  }
  if (prize < 0.8) {
    state.profile.aimLongers += 3;
    ui.matchReward.textContent = '+3 aim longers';
    firebaseService.saveProfile(state.profile);
    return { type: 'aimLongers', quantity: 3 };
  }
  const cents = 25 + Math.floor(Math.random() * 76);
  state.profile.walletCents += cents;
  ui.matchReward.textContent = `+$${(cents / 100).toFixed(2)} wallet reward`;
  firebaseService.saveProfile(state.profile);
  return { type: 'walletCents', quantity: cents };
}

document.querySelector('#startMatch').addEventListener('click', async () => {
  await rewardedAds.show('Watch this rewarded ad before every match.');
  state.activeMatch = true;
  ui.matchReward.textContent = 'Rack running';
  await firebaseService.saveProfile(state.profile);
  game.startMatch();
});

document.querySelector('#buyBallInHand').addEventListener('click', async () => {
  await rewardedAds.show('Watch an ad to add one ball in hand boost.');
  state.profile.ballInHands += 1;
  await firebaseService.saveProfile(state.profile);
  render();
});

document.querySelector('#buyAimLonger').addEventListener('click', async () => {
  await rewardedAds.show('Watch an ad to add one aim longer boost.');
  state.profile.aimLongers += 1;
  await firebaseService.saveProfile(state.profile);
  render();
});

document.querySelector('#useBallInHand').addEventListener('click', () => {
  if (state.profile.ballInHands < 1) return ui.hint.textContent = 'No ball in hand boosts. Watch an ad to earn one.';
  state.profile.ballInHands -= 1;
  firebaseService.saveProfile(state.profile);
  game.enableBallInHand();
  render();
});

document.querySelector('#useAimLonger').addEventListener('click', () => {
  if (state.profile.aimLongers < 1) return ui.hint.textContent = 'No aim longer boosts. Watch an ad to earn one.';
  state.profile.aimLongers -= 1;
  firebaseService.saveProfile(state.profile);
  game.enableAimLonger();
  render();
});

document.querySelector('#cashoutForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const amount = Math.round(Number(document.querySelector('#cashoutAmount').value) * 100);
  if (amount > state.profile.walletCents) return ui.hint.textContent = 'Cash-out amount exceeds wallet balance.';
  const payout = {
    uid: state.profile.uid,
    method: document.querySelector('#cashoutMethod').value,
    handle: document.querySelector('#cashoutHandle').value,
    amountCents: amount,
    status: 'pending_review',
    createdAt: new Date().toISOString(),
  };
  await firebaseService.requestPayout(payout);
  ui.hint.textContent = 'Payout request saved for admin review.';
});

firebaseService.loadProfile(state.profile.uid).then((profile) => {
  state.profile = profile ? { ...state.profile, ...profile } : state.profile;
  render();
});

render();
