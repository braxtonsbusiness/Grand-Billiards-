export class RewardedAdService {
  constructor({ dialog, meter, completeButton, copy }) {
    this.dialog = dialog;
    this.meter = meter;
    this.completeButton = completeButton;
    this.copy = copy;
  }

  show(message) {
    this.copy.textContent = message;
    this.meter.style.width = '0%';
    this.completeButton.disabled = true;
    this.dialog.showModal();

    return new Promise((resolve) => {
      let progress = 0;
      const timer = setInterval(() => {
        progress += 10;
        this.meter.style.width = `${progress}%`;
        if (progress >= 100) {
          clearInterval(timer);
          this.completeButton.disabled = false;
        }
      }, 180);

      this.completeButton.onclick = () => {
        this.dialog.close();
        resolve({ rewarded: true, adUnit: 'ca-app-pub-xxxxxxxxxxxxxxxx/rewarded' });
      };
    });
  }
}
