import React from "react";
import { getInitials, getAvatarPaletteById } from "../../utils/avatar";

export const UserAvatar = ({
  id = "",
  name = "",
  size = "md",
  colorClass = "",
  className = "",
  title = "",
}) => {
  const initials = getInitials(name);
  const finalColor = colorClass || getAvatarPaletteById(id, name);

  const sizeClasses =
    {
      xs: "w-5 h-5 text-[10px]",
      sm: "w-8 h-8 text-xs",
      md: "w-9 h-9 text-xs sm:text-sm",
      lg: "w-10 h-10 text-sm",
      xl: "w-12 h-12 text-base",
    }[size] || "w-9 h-9 text-xs sm:text-sm";

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold tracking-wider select-none shrink-0 shadow-sm ${sizeClasses} ${finalColor} ${className}`}
      aria-label={title || name || "User avatar"}
      title={title || name}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
