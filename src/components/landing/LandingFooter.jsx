
import logoXa from '../../assets/logo-xa.png';

export default function LandingFooter() {
    return (
        <footer className="bg-black border-t border-white/10 pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <img src={logoXa} alt="XA Logo" className="w-8 h-8 object-contain mix-blend-screen" />
                            <span className="text-xl font-bold">XAUDIT</span>
                        </div>
                        <p className="text-gray-500 max-w-sm">
                            The AI-powered code auditing platform for the modern web. Built for security, designed for speed.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6">PRODUCT</h4>
                        <ul className="space-y-4 text-sm text-gray-500">
                            <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                            <li><a href="#integration" className="hover:text-white transition-colors">Integrations</a></li>
                            <li><a href="#pricing" className="hover:text-white transition-colors">Enterprise</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6">COMPANY</h4>
                        <ul className="space-y-4 text-sm text-gray-500">
                            <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-sm text-gray-600">
                    <div>© 2025 XAUDIT AI Inc. All rights reserved.</div>
                </div>
            </div>
        </footer>
    );
}
