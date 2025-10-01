import useAppVersionWatcher from "../hooks/useAppVersionWatcher";

const VersionWatcher = () => {
  useAppVersionWatcher({ docPath: ["Meta", "App"], autoReload: true });
  return null; // no UI
};

export default VersionWatcher;
