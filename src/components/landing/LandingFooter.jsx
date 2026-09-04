
import logoXa from '../../assets/logo-xa.png';

export default function LandingFooter() {
    const handleScroll = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

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
                            A client-side, open-source static code checker for JavaScript, TypeScript, React/JSX, and HTML patterns. Not AI-powered, not a substitute for a professional security review.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6">PRODUCT</h4>
                        <ul className="space-y-4 text-sm text-gray-500">
                            <li><a href="#features" onClick={(e) => handleScroll(e, 'features')} className="hover:text-white transition-colors cursor-pointer">Features</a></li>
                            <li><a href="#integration" onClick={(e) => handleScroll(e, 'integration')} className="hover:text-white transition-colors cursor-pointer">How It Works</a></li>
                            <li><a href="#pricing" onClick={(e) => handleScroll(e, 'pricing')} className="hover:text-white transition-colors cursor-pointer">Pricing</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-6">COMPANY</h4>
                        <ul className="space-y-4 text-sm text-gray-500">
                            <li><a href="#about" onClick={(e) => handleScroll(e, 'about')} className="hover:text-white transition-colors cursor-pointer">About</a></li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-sm text-gray-600">
                    <div>© {new Date().getFullYear()} XAUDIT. Open source. Not a company, not a security guarantee.</div>
                </div>
            </div>
        </footer>
    );
}
