declare module "@/components/ui/card" {
  import * as React from "react";
  interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
  interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
  interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {}
  interface CardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}
  interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
  interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

  const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;
  const CardHeader: React.ForwardRefExoticComponent<CardHeaderProps & React.RefAttributes<HTMLDivElement>>;
  const CardTitle: React.ForwardRefExoticComponent<CardTitleProps & React.RefAttributes<HTMLDivElement>>;
  const CardDescription: React.ForwardRefExoticComponent<CardDescriptionProps & React.RefAttributes<HTMLDivElement>>;
  const CardContent: React.ForwardRefExoticComponent<CardContentProps & React.RefAttributes<HTMLDivElement>>;
  const CardFooter: React.ForwardRefExoticComponent<CardFooterProps & React.RefAttributes<HTMLDivElement>>;

  export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
}
