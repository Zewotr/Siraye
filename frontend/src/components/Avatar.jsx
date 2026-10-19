export default function Avatar({ user, size = "md", className = "" }) {
  const dimensions = { xs: "h-5 w-5 text-[8px]", sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-11 w-11 text-sm" };
  const label = user?.name || user?.email || "Siraye user";
  const initials = label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return user?.profile_picture ? (
    <img alt={label} className={`${dimensions[size]} shrink-0 rounded-full object-cover ${className}`} src={user.profile_picture} />
  ) : (
    <span className={`${dimensions[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 font-bold text-white ${className}`}>
      {initials}
    </span>
  );
}
