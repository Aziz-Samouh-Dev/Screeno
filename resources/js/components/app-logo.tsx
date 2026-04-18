import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md ">
                <AppLogoIcon className=" size-8 fill-current " />
            </div>
            <div className="ml-1 grid flex-1 text-left text-xl">
                <span className="font-mono uppercase tracking-wider truncate leading-tight font-semibold">
                    Screeno
                </span>
            </div>
        </>
    );
}
