export default class Toast {
  constructor() {
    this.container = document.querySelector("main");
    // this.enginesActive = false;
  }

  showToast(opt_message) {
    // options = defaults({}, opt_options, {
    //   duration: 0,
    //   buttons: ["dismiss"]
    // });

    let documentFragment = document.createDocumentFragment();

    let toastsDiv = document.createElement("div");
    toastsDiv.className = "toasts";

    documentFragment.appendChild(toastsDiv);

    let toastDiv = document.createElement("div");
    toastDiv.className = "toast";

    let toastContent = document.createElement("div");
    toastContent.className = "toast-content";
    toastContent.innerHTML = opt_message;
    toastDiv.appendChild(toastContent);

    let toastButton = document.createElement("button");
    toastButton.innerHTML = "WHATEVER";
    // toastButton.className = "toast toast-content";
    toastDiv.appendChild(toastButton);

    // toastDiv.innerHTML = opt_message;

    toastDiv.style.setProperty("opacity", 1);
    toastsDiv.appendChild(toastDiv);

    // window.requestAnimationFrame(this.container.appendChild(documentFragment));
    this.container.appendChild(documentFragment);

    console.log("ToastClass");
    console.log("ToastClass container: ", this.container);
    console.log("ToastClass message: ", opt_message);
  }
}
