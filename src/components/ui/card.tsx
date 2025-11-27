import React from 'react';
import CardBase, { CardBody as BaseCardBody, CardHeader as BaseCardHeader } from '../Card';

type DivProps = React.HTMLAttributes<HTMLDivElement>;
type HeadingProps = React.HTMLAttributes<HTMLHeadingElement>;
type ParagraphProps = React.HTMLAttributes<HTMLParagraphElement>;

const classNames = (...values: Array<string | undefined>): string =>
	values.filter(Boolean).join(' ');

const Card = CardBase;

const CardHeader: React.FC<DivProps> = ({ children, className, ...props }) => (
	<BaseCardHeader className={classNames(className)} {...props}>
		{children}
	</BaseCardHeader>
);

const CardContent: React.FC<DivProps> = ({ children, className, ...props }) => (
	<BaseCardBody className={classNames(className)} {...props}>
		{children}
	</BaseCardBody>
);

const CardTitle: React.FC<HeadingProps> = ({ children, className, ...props }) => (
	<h3 className={classNames('text-lg font-semibold leading-snug', className)} {...props}>
		{children}
	</h3>
);

const CardDescription: React.FC<ParagraphProps> = ({ children, className, ...props }) => (
	<p className={classNames('text-sm text-gray-600', className)} {...props}>
		{children}
	</p>
);

export { Card, CardHeader, CardContent, CardTitle, CardDescription };
export default Card;


