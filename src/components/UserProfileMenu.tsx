import { useState } from "react";
import { getPlanLabel, type UserProfile } from "../lib/auth";

export default function UserProfileMenu({
  user,
  disabled,
  loggingOut,
  error,
  onLogout,
}: {
  user: UserProfile | null;
  disabled: boolean;
  loggingOut: boolean;
  error: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const name = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
    : "Guest";
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() ||
      user.email.charAt(0).toUpperCase()
    : "G";

  return (
    <div className="account-menu">
      <button
        aria-expanded={open}
        aria-controls="account-profile"
        aria-label={user ? `User profile: ${name}` : "Guest profile"}
        className="account-trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="avatar">
          {user?.profileImage && failedImage !== user.profileImage ? (
            <img alt="" src={user.profileImage} onError={() => setFailedImage(user.profileImage)} />
          ) : initials}
        </span>
        <span className="account-name">{name}</span>
      </button>
      {open && (
        <section aria-label="User profile" className="account-panel" id="account-profile">
          <div className="account-heading">
            <strong>{user ? "Your profile" : "Guest session"}</strong>
            <button aria-label="Close profile" onClick={() => setOpen(false)} type="button">Close</button>
          </div>
          {user ? (
            <dl>
              <div><dt>Name</dt><dd>{name}</dd></div>
              <div><dt>Email</dt><dd>{user.email}</dd></div>
              {user.phoneNumber && <div><dt>Phone number</dt><dd>{user.phoneNumber}</dd></div>}
              <div><dt>Plan</dt><dd>{getPlanLabel(user.role)}</dd></div>
            </dl>
          ) : <p>Sign in to view your account profile.</p>}
          {error && <p className="account-error" role="alert">{error}</p>}
          <button
            className="account-logout"
            disabled={disabled}
            onClick={onLogout}
            type="button"
          >
            {loggingOut ? "Logging out..." : user ? "Log out" : "Exit guest session"}
          </button>
        </section>
      )}
    </div>
  );
}
