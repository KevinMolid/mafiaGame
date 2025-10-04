import useAppVersionWatcher from "../hooks/useAppVersionWatcher";

const VersionWatcher = () => {
  useAppVersionWatcher({ docPath: ["Config", "app"], autoReload: true });
  return null; // no UI
};

export default VersionWatcher;
