import Masonry from "react-masonry-css";
import { cn } from "../../lib/cn";

const DEFAULT_COLS = { default: 4, 1280: 3, 900: 2, 560: 1 };

export function MasonryGrid({
  breakpointCols = DEFAULT_COLS,
  children,
  className,
}) {
  return (
    <Masonry
      breakpointCols={breakpointCols}
      className={cn("flex -ml-3 w-auto", className)}
      columnClassName="pl-3 bg-clip-padding"
    >
      {children}
    </Masonry>
  );
}

export default MasonryGrid;
