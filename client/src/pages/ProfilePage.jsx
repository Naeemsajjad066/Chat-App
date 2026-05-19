import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

function ProfilePage() {
  const { authUser, updateProfile, deleteProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedImg, setSelectedImg]         = useState(null);
  const [name, setName]                       = useState(authUser.fullName);
  const [bio, setBio]                         = useState(authUser.bio || "");
  const [isSaving, setIsSaving]               = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const previewSrc = selectedImg
    ? URL.createObjectURL(selectedImg)
    : authUser?.profilePic || assets.avatar_icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    if (!selectedImg) {
      await updateProfile({ fullName: name, bio });
    } else {
      const reader = new FileReader();
      reader.readAsDataURL(selectedImg);
      await new Promise((resolve) => {
        reader.onload = async () => {
          await updateProfile({ profilePic: reader.result, fullName: name, bio });
          resolve();
        };
      });
    }

    setIsSaving(false);
    navigate("/");
  };

  const handleDelete = async () => {
    const ok = await deleteProfile();
    if (ok) navigate("/login");
  };

  return (
    <div className="min-h-dvh w-full overflow-y-auto flex flex-col items-center
      justify-start sm:justify-center px-4 py-8 sm:py-12">

      <div className="w-full max-w-md bg-white/5 border border-white/10
        rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-white/8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-white
              active:text-gray-200 transition text-sm mb-5 -ml-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to chats
          </button>
          <h1 className="text-lg font-semibold text-white">Profile Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update your personal information</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group flex-shrink-0">
              <img
                src={previewSrc}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-violet-500/30"
              />
              <label
                htmlFor="avatar"
                className="absolute inset-0 rounded-full bg-black/50 flex items-center
                  justify-center cursor-pointer opacity-0 group-hover:opacity-100
                  active:opacity-100 transition-opacity"
                aria-label="Change profile photo"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
              <input
                onChange={(e) => setSelectedImg(e.target.files[0])}
                type="file"
                id="avatar"
                accept=".png,.jpg,.jpeg,.webp"
                hidden
              />
            </div>

            <div className="min-w-0">
              <p className="text-white font-medium truncate">{authUser.fullName}</p>
              <p className="text-gray-500 text-sm truncate">{authUser.email}</p>
              <label
                htmlFor="avatar"
                className="text-violet-400 text-xs mt-1 cursor-pointer
                  hover:text-violet-300 active:text-violet-200 transition inline-block"
              >
                Change photo
              </label>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="profile-name" className="block text-xs font-medium text-gray-400">
              Full Name
            </label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
              placeholder="Your name"
              className="w-full bg-white/5 border border-white/10 rounded-xl
                px-4 py-3 text-base text-white placeholder-gray-600
                outline-none focus:border-violet-500/60 focus:bg-white/8 transition"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label htmlFor="profile-bio" className="block text-xs font-medium text-gray-400">
              Bio
            </label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people a little about yourself…"
              rows={3}
              maxLength={160}
              className="w-full bg-white/5 border border-white/10 rounded-xl
                px-4 py-3 text-base text-white placeholder-gray-600
                outline-none focus:border-violet-500/60 focus:bg-white/8
                resize-none transition"
            />
            <p className="text-right text-[11px] text-gray-600">{bio.length}/160</p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-1">
            <Button
              type="submit"
              loading={isSaving}
              className="w-full py-3 text-base font-semibold"
            >
              Save Changes
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-3 text-base border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Delete Account
            </Button>
          </div>
        </form>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg">Delete Account</h3>
        </div>
        <p className="text-gray-400 text-sm mb-3">
          This is permanent and cannot be undone. The following will be deleted:
        </p>
        <ul className="text-sm text-gray-500 list-disc list-inside mb-6 space-y-1">
          <li>Your profile and account</li>
          <li>All messages and chat history</li>
          <li>Your profile picture</li>
        </ul>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
            className="flex-1 py-3"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            className="flex-1 py-3 font-semibold"
          >
            Delete Forever
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default ProfilePage;
