"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Icon from "@/components/Icon";
import {
  getProfile,
  saveProfile,
} from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { UserProfile } from "@/lib/types";

const emptyProfile: UserProfile = {
  id: "current",
  fullName: "",
  email: "",
  title: "",
  location: "",
  phone: "",
  website: "",
  bio: "",
};

function cameraErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof DOMException &&
    error.name === "NotAllowedError"
  ) {
    return (
      "Camera permission was denied. Allow camera " +
      "access in the browser and try again."
    );
  }

  if (
    error instanceof DOMException &&
    error.name === "NotFoundError"
  ) {
    return "No camera was found on this device.";
  }

  return (
    "The camera could not be opened. Use localhost " +
    "or HTTPS and check the browser camera permission."
  );
}

export default function ProfileManager() {
  const [profile, setProfile] =
    useState<UserProfile>(emptyProfile);
  const [avatarUrl, setAvatarUrl] =
    useState("");
  const [previewOpen, setPreviewOpen] =
    useState(false);
  const [cameraOpen, setCameraOpen] =
    useState(false);
  const [cameraReady, setCameraReady] =
    useState(false);
  const [cameraError, setCameraError] =
    useState("");
  const [message, setMessage] =
    useState("");

  const avatarObjectUrl = useRef("");
  const videoRef =
    useRef<HTMLVideoElement>(null);
  const cameraStream =
    useRef<MediaStream | null>(null);

  function stopCameraStream() {
    cameraStream.current
      ?.getTracks()
      .forEach((track) => track.stop());
    cameraStream.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }

  function closeCamera() {
    stopCameraStream();
    setCameraOpen(false);
    setCameraError("");
  }

  function updateAvatarUrl(blob?: Blob) {
    if (avatarObjectUrl.current) {
      URL.revokeObjectURL(
        avatarObjectUrl.current,
      );
      avatarObjectUrl.current = "";
    }

    if (blob) {
      const nextUrl =
        URL.createObjectURL(blob);
      avatarObjectUrl.current =
        nextUrl;
      setAvatarUrl(nextUrl);
    } else {
      setAvatarUrl("");
    }
  }

  useEffect(() => {
    async function load() {
      const stored = await getProfile();
      const user = getCurrentUser();

      const nextProfile = stored ?? {
        ...emptyProfile,
        fullName: user?.name ?? "",
        email: user?.email ?? "",
      };

      setProfile(nextProfile);
      updateAvatarUrl(
        nextProfile.avatar,
      );
    }

    void load();

    return () => {
      stopCameraStream();

      if (avatarObjectUrl.current) {
        URL.revokeObjectURL(
          avatarObjectUrl.current,
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!cameraOpen) {
      return;
    }

    let cancelled = false;

    async function startCamera() {
      setCameraReady(false);
      setCameraError("");

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(
          "This browser does not support direct camera capture.",
        );
        return;
      }

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: false,
              video: {
                facingMode: "user",
                width: {
                  ideal: 1280,
                },
                height: {
                  ideal: 720,
                },
              },
            },
          );

        if (cancelled) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop(),
            );
          return;
        }

        cameraStream.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;
          await videoRef.current.play();
        }
      } catch (error) {
        if (!cancelled) {
          setCameraError(
            cameraErrorMessage(error),
          );
        }
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [cameraOpen]);

  useEffect(() => {
    if (!cameraOpen) return;

    function closeWithEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        closeCamera();
      }
    }

    document.addEventListener(
      "keydown",
      closeWithEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        closeWithEscape,
      );
    };
  }, [cameraOpen]);

  function update(
    key: keyof UserProfile,
    value: string,
  ) {
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
    setMessage("");
  }

  function applyAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage(
        "Profile picture must be an image.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        "Profile picture must not exceed 5 MB.",
      );
      return;
    }

    updateAvatarUrl(file);
    setProfile((current) => ({
      ...current,
      avatar: file,
    }));
    setMessage(
      "New profile picture selected. Save the profile to keep it.",
    );
  }

  function chooseAvatar(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    applyAvatar(file);
    event.target.value = "";
  }

  function captureCurrentFrame() {
    const video = videoRef.current;

    if (
      !video ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      setCameraError(
        "Wait for the camera preview before capturing.",
      );
      return;
    }

    const canvas =
      document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context =
      canvas.getContext("2d");

    if (!context) {
      setCameraError(
        "The browser could not process the captured image.",
      );
      return;
    }

    context.translate(
      canvas.width,
      0,
    );
    context.scale(-1, 1);
    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError(
            "The captured photo could not be saved.",
          );
          return;
        }

        const file = new File(
          [blob],
          `profile-photo-${Date.now()}.jpg`,
          {
            type: "image/jpeg",
          },
        );

        applyAvatar(file);
        closeCamera();
      },
      "image/jpeg",
      0.9,
    );
  }

  function removeAvatar() {
    updateAvatarUrl();
    setProfile((current) => ({
      ...current,
      avatar: undefined,
    }));
    setPreviewOpen(false);
    setMessage(
      "Profile picture removed. Save the profile to keep this change.",
    );
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();
    await saveProfile(profile);
    setMessage(
      "Profile saved successfully.",
    );
  }

  return (
    <div className="profile-layout">
      <aside className="profile-card">
        <button
          type="button"
          className="avatar-preview-button"
          onClick={() =>
            avatarUrl &&
            setPreviewOpen(true)
          }
          aria-label={
            avatarUrl
              ? "Open profile picture preview"
              : "No profile picture selected"
          }
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Current profile"
            />
          ) : (
            <span>
              <Icon
                name="user"
                size={44}
              />
            </span>
          )}

          {avatarUrl && (
            <em>
              <Icon
                name="eye"
                size={16}
              />
              View photo
            </em>
          )}
        </button>

        <div className="profile-photo-actions">
          <button
            type="button"
            className="photo-action-button"
            onClick={() =>
              setCameraOpen(true)
            }
          >
            <Icon
              name="camera"
              size={18}
            />
            Take photo
          </button>

          <label className="photo-action-button">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={chooseAvatar}
            />
            <Icon
              name="image"
              size={18}
            />
            Choose from gallery
          </label>
        </div>

        {avatarUrl && (
          <button
            type="button"
            className="remove-photo-button"
            onClick={removeAvatar}
          >
            <Icon
              name="trash"
              size={16}
            />
            Remove photo
          </button>
        )}

        <div className="profile-identity">
          <h2>
            {profile.fullName ||
              "Your name"}
          </h2>
          <p>
            {profile.title ||
              "Professional title"}
          </p>
        </div>

        <div className="profile-meta">
          {profile.email && (
            <span>
              <Icon
                name="mail"
                size={16}
              />
              {profile.email}
            </span>
          )}

          {profile.location && (
            <span>
              <Icon
                name="location"
                size={16}
              />
              {profile.location}
            </span>
          )}

          {profile.website && (
            <span>
              <Icon
                name="link"
                size={16}
              />
              {profile.website}
            </span>
          )}
        </div>
      </aside>

      <form
        onSubmit={submit}
        className="profile-form"
      >
        <div className="panel-heading">
          <div>
            <span className="eyebrow">
              Personal details
            </span>
            <h2>
              Maintain your user profile
            </h2>
          </div>

          <button
            type="submit"
            className="primary-button small-button"
          >
            <Icon
              name="save"
              size={18}
            />
            Save profile
          </button>
        </div>

        <div className="builder-fields">
          <div className="two-fields">
            <label>
              Full name
              <input
                value={profile.fullName}
                onChange={(event) =>
                  update(
                    "fullName",
                    event.target.value,
                  )
                }
                className="input-control"
              />
            </label>

            <label>
              Professional title
              <input
                value={profile.title}
                onChange={(event) =>
                  update(
                    "title",
                    event.target.value,
                  )
                }
                className="input-control"
              />
            </label>
          </div>

          <div className="two-fields">
            <label>
              Email
              <input
                type="email"
                value={profile.email}
                onChange={(event) =>
                  update(
                    "email",
                    event.target.value,
                  )
                }
                className="input-control"
              />
            </label>

            <label>
              Phone
              <input
                value={profile.phone}
                onChange={(event) =>
                  update(
                    "phone",
                    event.target.value,
                  )
                }
                className="input-control"
              />
            </label>
          </div>

          <div className="two-fields">
            <label>
              Location
              <input
                value={profile.location}
                onChange={(event) =>
                  update(
                    "location",
                    event.target.value,
                  )
                }
                className="input-control"
              />
            </label>

            <label>
              Website / portfolio
              <input
                value={profile.website}
                onChange={(event) =>
                  update(
                    "website",
                    event.target.value,
                  )
                }
                className="input-control"
              />
            </label>
          </div>

          <label>
            Professional bio
            <textarea
              value={profile.bio}
              onChange={(event) =>
                update(
                  "bio",
                  event.target.value,
                )
              }
              rows={7}
              className="input-control textarea"
            />
          </label>

          {message && (
            <div
              className={
                message.includes(
                  "successfully",
                )
                  ? "success-banner"
                  : message.includes(
                        "selected",
                      )
                    ? "info-banner"
                    : "error-banner"
              }
            >
              {message}
            </div>
          )}
        </div>
      </form>

      {previewOpen && avatarUrl && (
        <div
          className="photo-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Profile picture preview"
        >
          <button
            type="button"
            className="photo-modal-backdrop"
            aria-label="Close profile picture preview"
            onClick={() =>
              setPreviewOpen(false)
            }
          />

          <div className="photo-modal-content">
            <button
              type="button"
              className="photo-modal-close"
              onClick={() =>
                setPreviewOpen(false)
              }
              aria-label="Close preview"
            >
              <Icon
                name="close"
                size={20}
              />
            </button>

            <img
              src={avatarUrl}
              alt="Profile picture preview"
            />
          </div>
        </div>
      )}

      {cameraOpen && (
        <div
          className="camera-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Take profile photo"
        >
          <button
            type="button"
            className="camera-modal-backdrop"
            aria-label="Close camera"
            onClick={closeCamera}
          />

          <div className="camera-modal-content">
            <header>
              <div>
                <span className="eyebrow">
                  Camera
                </span>
                <h2>
                  Take your profile photo
                </h2>
              </div>

              <button
                type="button"
                className="camera-close-button"
                onClick={closeCamera}
                aria-label="Close camera"
              >
                <Icon
                  name="close"
                  size={20}
                />
              </button>
            </header>

            <div className="camera-viewfinder">
              {cameraError ? (
                <div className="camera-error">
                  <Icon
                    name="camera"
                    size={34}
                  />
                  <p>{cameraError}</p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    onCanPlay={() =>
                      setCameraReady(true)
                    }
                  />
                  <span className="camera-guide" />
                </>
              )}
            </div>

            <div className="camera-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeCamera}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                disabled={
                  !cameraReady ||
                  Boolean(cameraError)
                }
                onClick={
                  captureCurrentFrame
                }
              >
                <Icon
                  name="camera"
                  size={18}
                />
                Capture photo
              </button>
            </div>

            <p className="camera-note">
              Camera access works on localhost
              or a secure HTTPS website after
              permission is allowed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
