import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Menu Container
interface MenuProps {
  children: React.ReactNode;
  className?: string;
}

const Menu = React.forwardRef<HTMLDivElement, MenuProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('menu flex flex-col min-w-[220px] rounded-md p-1', className)}
      {...props}
    >
      {children}
    </div>
  )
);
Menu.displayName = 'Menu';

// Menu Item
interface MenuItemProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  active?: boolean;
}

const MenuItem = React.forwardRef<HTMLDivElement, MenuItemProps>(
  ({ children, className, disabled, onClick, active, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'menu-item relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'focus:bg-gray-800/50 focus:text-gray-100',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        active && 'bg-gray-800/50 text-gray-100',
        disabled && 'pointer-events-none opacity-50',
        'text-gray-300 hover:bg-gray-800/50 hover:text-gray-100',
        className
      )}
      onClick={onClick}
      data-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  )
);
MenuItem.displayName = 'MenuItem';

// Menu Label
interface MenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

const MenuLabel = React.forwardRef<HTMLDivElement, MenuLabelProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('menu-label px-2 py-1.5 text-sm font-semibold text-gray-400', className)}
      {...props}
    >
      {children}
    </div>
  )
);
MenuLabel.displayName = 'MenuLabel';

// Menu Separator
const MenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('menu-separator -mx-1 my-1 h-px bg-gray-800', className)}
    {...props}
  />
));
MenuSeparator.displayName = 'MenuSeparator';

// Menu Icon
interface MenuIconProps {
  children: React.ReactNode;
  className?: string;
}

const MenuIcon = React.forwardRef<HTMLSpanElement, MenuIconProps>(
  ({ children, className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('menu-icon mr-2 h-4 w-4 text-gray-400', className)}
      {...props}
    >
      {children}
    </span>
  )
);
MenuIcon.displayName = 'MenuIcon';

// Menu Badge
interface MenuBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const MenuBadge = React.forwardRef<HTMLSpanElement, MenuBadgeProps>(
  ({ children, variant = 'default', className, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-primary/10 text-primary',
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      danger: 'bg-destructive/10 text-destructive'
    };

    return (
      <span
        ref={ref}
        className={cn(
          'menu-badge ml-auto rounded-full px-2 py-0.5 text-xs font-medium',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
MenuBadge.displayName = 'MenuBadge';

// Menu Bullet
interface MenuBulletProps {
  className?: string;
}

const MenuBullet = React.forwardRef<HTMLSpanElement, MenuBulletProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'menu-bullet mr-2 h-1.5 w-1.5 rounded-full bg-current opacity-70',
        className
      )}
      {...props}
    />
  )
);
MenuBullet.displayName = 'MenuBullet';

// Menu Heading
interface MenuHeadingProps {
  children: React.ReactNode;
  className?: string;
}

const MenuHeading = React.forwardRef<HTMLDivElement, MenuHeadingProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'menu-heading px-2 py-1.5 text-xs font-semibold text-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
MenuHeading.displayName = 'MenuHeading';

// Menu Sub
interface MenuSubProps {
  children: React.ReactNode;
  className?: string;
  trigger: React.ReactNode;
}

const MenuSub = React.forwardRef<HTMLDivElement, MenuSubProps>(
  ({ children, className, trigger, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <div ref={ref} className={cn('menu-sub relative', className)} {...props}>
        <div
          className={cn(
            'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
            'focus:bg-gray-800/50 focus:text-gray-100',
            'hover:bg-gray-800/50 hover:text-gray-100',
            'text-gray-300',
            isOpen && 'bg-gray-800/50 text-gray-100'
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {trigger}
          <ChevronRight className={cn(
            'ml-auto h-4 w-4 text-gray-400 transition-transform duration-200',
            isOpen && 'rotate-90'
          )} />
        </div>
        {isOpen && (
          <div className="pl-4 mt-1">
            {children}
          </div>
        )}
      </div>
    );
  }
);
MenuSub.displayName = 'MenuSub';

// Menu Link
interface MenuLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  disabled?: boolean;
}

const MenuLink = React.forwardRef<HTMLAnchorElement, MenuLinkProps>(
  ({ className, active, disabled, children, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        'menu-link relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'focus:bg-gray-800/50 focus:text-gray-100',
        'hover:bg-gray-800/50 hover:text-gray-100',
        'text-gray-300',
        active && 'bg-gray-800/50 text-gray-100',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
);
MenuLink.displayName = 'MenuLink';

export {
  Menu,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuIcon,
  MenuBadge,
  MenuBullet,
  MenuHeading,
  MenuSub,
  MenuLink
};