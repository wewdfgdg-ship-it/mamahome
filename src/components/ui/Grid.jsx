import React, { forwardRef } from 'react';
import { clsx as cn } from 'clsx';

// Grid Container
export const Grid = forwardRef(({ 
  children,
  cols = 12,
  gap = 'default',
  className,
  ...props 
}, ref) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
    10: 'grid-cols-10',
    11: 'grid-cols-11',
    12: 'grid-cols-12',
    auto: 'grid-cols-auto'
  };
  
  const gaps = {
    none: 'gap-0',
    xs: 'gap-2',
    sm: 'gap-4',
    default: 'gap-5',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        'grid',
        gridCols[cols],
        gaps[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Grid.displayName = 'Grid';

// Grid Item
export const GridItem = forwardRef(({ 
  children,
  span = 1,
  spanSm,
  spanMd,
  spanLg,
  start,
  end,
  className,
  ...props 
}, ref) => {
  const spans = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    7: 'col-span-7',
    8: 'col-span-8',
    9: 'col-span-9',
    10: 'col-span-10',
    11: 'col-span-11',
    12: 'col-span-12',
    full: 'col-span-full'
  };
  
  const responsiveSpans = {
    sm: {
      1: 'sm:col-span-1',
      2: 'sm:col-span-2',
      3: 'sm:col-span-3',
      4: 'sm:col-span-4',
      5: 'sm:col-span-5',
      6: 'sm:col-span-6',
      7: 'sm:col-span-7',
      8: 'sm:col-span-8',
      9: 'sm:col-span-9',
      10: 'sm:col-span-10',
      11: 'sm:col-span-11',
      12: 'sm:col-span-12'
    },
    md: {
      1: 'md:col-span-1',
      2: 'md:col-span-2',
      3: 'md:col-span-3',
      4: 'md:col-span-4',
      5: 'md:col-span-5',
      6: 'md:col-span-6',
      7: 'md:col-span-7',
      8: 'md:col-span-8',
      9: 'md:col-span-9',
      10: 'md:col-span-10',
      11: 'md:col-span-11',
      12: 'md:col-span-12'
    },
    lg: {
      1: 'lg:col-span-1',
      2: 'lg:col-span-2',
      3: 'lg:col-span-3',
      4: 'lg:col-span-4',
      5: 'lg:col-span-5',
      6: 'lg:col-span-6',
      7: 'lg:col-span-7',
      8: 'lg:col-span-8',
      9: 'lg:col-span-9',
      10: 'lg:col-span-10',
      11: 'lg:col-span-11',
      12: 'lg:col-span-12'
    }
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        spans[span],
        spanSm && responsiveSpans.sm[spanSm],
        spanMd && responsiveSpans.md[spanMd],
        spanLg && responsiveSpans.lg[spanLg],
        start && `col-start-${start}`,
        end && `col-end-${end}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

GridItem.displayName = 'GridItem';

export default Grid;