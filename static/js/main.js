const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");

const savedTheme =
    localStorage.getItem("resumeiq-theme") || "dark";

root.dataset.theme = savedTheme;

function updateThemeIcon() {
    if (!themeToggle) return;

    themeToggle.textContent =
        root.dataset.theme === "dark" ? "☼" : "☾";
}

updateThemeIcon();

themeToggle?.addEventListener("click", () => {
    const nextTheme =
        root.dataset.theme === "dark"
            ? "light"
            : "dark";

    root.dataset.theme = nextTheme;

    localStorage.setItem(
        "resumeiq-theme",
        nextTheme
    );

    updateThemeIcon();
});

menuButton?.addEventListener("click", () => {
    navLinks?.classList.toggle("open");
});

document
    .querySelectorAll(".nav-links a")
    .forEach((link) => {
        link.addEventListener("click", () => {
            navLinks?.classList.remove("open");
        });
    });

document
    .querySelectorAll(".flash-message button")
    .forEach((button) => {
        button.addEventListener("click", () => {
            button.parentElement.remove();
        });
    });

setTimeout(() => {
    document
        .querySelectorAll(".flash-message")
        .forEach((message) => {
            message.classList.add("fade-out");
        });
}, 4500);

document
    .querySelectorAll(".password-toggle")
    .forEach((button) => {
        button.addEventListener("click", () => {
            const input =
                button.parentElement.querySelector("input");

            const isVisible =
                input.type === "text";

            input.type =
                isVisible ? "password" : "text";

            button.textContent =
                isVisible ? "Show" : "Hide";
        });
    });

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    },
    {
        threshold: 0.12,
    }
);

document
    .querySelectorAll(".reveal")
    .forEach((element) => {
        revealObserver.observe(element);
    });

const dropZone =
    document.getElementById("dropZone");

const resumeInput =
    document.getElementById("resumeInput");

const selectedFile =
    document.getElementById("selectedFile");

const selectedFileName =
    document.getElementById("selectedFileName");

const selectedFileSize =
    document.getElementById("selectedFileSize");

const removeFile =
    document.getElementById("removeFile");

function formatFileSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} bytes`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(
        bytes / 1024 / 1024
    ).toFixed(2)} MB`;
}

function displaySelectedFile(file) {
    if (
        !file ||
        !selectedFile ||
        !selectedFileName ||
        !selectedFileSize
    ) {
        return;
    }

    const allowedExtensions =
        /\.(pdf|docx|txt)$/i;

    if (!allowedExtensions.test(file.name)) {
        alert(
            "Please select a PDF, DOCX or TXT file."
        );

        resumeInput.value = "";
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert(
            "The selected file is larger than 10 MB."
        );

        resumeInput.value = "";
        return;
    }

    selectedFileName.textContent = file.name;
    selectedFileSize.textContent =
        formatFileSize(file.size);

    selectedFile.hidden = false;
    dropZone?.classList.add("has-file");
}

resumeInput?.addEventListener("change", () => {
    displaySelectedFile(
        resumeInput.files[0]
    );
});

dropZone?.addEventListener(
    "dragover",
    (event) => {
        event.preventDefault();
        dropZone.classList.add("dragging");
    }
);

dropZone?.addEventListener(
    "dragleave",
    () => {
        dropZone.classList.remove("dragging");
    }
);

dropZone?.addEventListener(
    "drop",
    (event) => {
        event.preventDefault();

        dropZone.classList.remove("dragging");

        const file =
            event.dataTransfer.files[0];

        if (!file) return;

        const transfer = new DataTransfer();
        transfer.items.add(file);

        resumeInput.files = transfer.files;

        displaySelectedFile(file);
    }
);

removeFile?.addEventListener(
    "click",
    () => {
        resumeInput.value = "";
        selectedFile.hidden = true;

        dropZone?.classList.remove(
            "has-file"
        );
    }
);

const jobDescription =
    document.getElementById("jobDescription");

const characterCount =
    document.getElementById("characterCount");

function updateCharacterCount() {
    if (
        !jobDescription ||
        !characterCount
    ) {
        return;
    }

    characterCount.textContent =
        `${jobDescription.value.length} characters`;
}

jobDescription?.addEventListener(
    "input",
    updateCharacterCount
);

document
    .getElementById("clearDescription")
    ?.addEventListener("click", () => {
        jobDescription.value = "";
        updateCharacterCount();
    });

const analysisForm =
    document.getElementById("analysisForm");

const loadingOverlay =
    document.getElementById("loadingOverlay");

const loadingText =
    document.getElementById("loadingText");

analysisForm?.addEventListener(
    "submit",
    () => {
        if (!resumeInput.files.length) {
            return;
        }

        loadingOverlay.hidden = false;
        document.body.style.overflow =
            "hidden";

        const messages = [
            "Reading resume content...",
            "Detecting skills and sections...",
            "Comparing job keywords...",
            "Calculating match score...",
            "Preparing recommendations...",
        ];

        let currentMessage = 0;

        window.setInterval(() => {
            currentMessage =
                (currentMessage + 1)
                % messages.length;

            loadingText.textContent =
                messages[currentMessage];
        }, 1100);
    }
);

      const avatarInput = document.getElementById("avatarInput");
const avatarPreview = document.getElementById("avatarPreview");
const avatarLetter = document.getElementById("avatarLetter");
const avatarError = document.getElementById("avatarError");
const avatarSubmit = document.getElementById("avatarSubmit");

const allowedImageTypes = ["image/png", "image/jpeg", "image/webp"];

avatarInput?.addEventListener("change", () => {
    const file = avatarInput.files[0];
    if (!file) return;

    if (!allowedImageTypes.includes(file.type)) {
        avatarError.hidden = false;
        avatarSubmit.hidden = true;
        avatarInput.value = "";
        return;
    }

    avatarError.hidden = true;
    avatarSubmit.hidden = false;

    const reader = new FileReader();
    reader.onload = (e) => {
        avatarPreview.src = e.target.result;
        avatarPreview.hidden = false;
        avatarLetter?.setAttribute("hidden", "");
    };
    reader.readAsDataURL(file);
});