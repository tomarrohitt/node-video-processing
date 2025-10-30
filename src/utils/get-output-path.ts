import path from "path";

export const getOutputPath = (fullPath: string) => {
  const parsedPath = path.parse(fullPath);

  return path.join(
    parsedPath.dir,
    `${parsedPath.name}-compressed${parsedPath.ext}`
  );
};
