declare module "@/components/ui/progress" {
  import * as React from "react";
  interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
    extraStyles?: string;
  }
  const Progress: React.ForwardRefExoticComponent<
    ProgressProps & React.RefAttributes<HTMLDivElement>
  >;
  export { Progress };
}
