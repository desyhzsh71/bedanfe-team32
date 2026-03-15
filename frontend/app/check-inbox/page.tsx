import Image from "next/image";
import { IoMdArrowBack } from "react-icons/io";

export default function Check() {
    return(
        <div>
            <div className="bg-white grid grid-cols-2 min-h-screen">
                <div className="p-4 m-auto w-full">
                    <p className="text-2xl text-center mb-2">Check Your Inbox!</p>
                    <p className="px-8 text-center text-xs mb-4">We’ve sent a password reset link to (example@email.com) - it’s valid for 24 hours. Don’t forget to check spam too!</p>
                    <div className="px-8 mb-4">
                        <a href="#" className="block rounded-md text-center text-white bg-[#F93232] p-3" role="button" type="submit">Open Gmail</a>
                    </div>
                    <div className="px-8">
                        <a href="signup/login" className="flex items-center justify-center gap-3 rounded-full text-center p-3">
                            <IoMdArrowBack
                                width={70}
                                height={70} />
                            <span>Back To Login</span>
                        </a>
                    </div>
                </div>
                <div className="min-h-screen bg-[#3A7AC3] flex items-center justify-center">
                    <Image
                        src="/Images/Logo1.png"
                        alt="Logo1"
                        width={200}
                        height={200}
                        className="m-auto" />
                </div>
            </div>
        </div>
    );
}