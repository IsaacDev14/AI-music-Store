// client/src/pages/Learn/SkillLevel.tsx
import { ChartBarIcon } from '@heroicons/react/24/outline';

const SkillLevel = () => {
    return (
        <div className="p-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                Skill Level Assessment
            </h1>
            <p className="text-lg text-gray-600 mb-10">
                Let's set your starting point. Select your current proficiency level.
            </p>
            <div className="grid grid-cols-3 gap-6 max-w-2xl mt-8">
                {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                    <div key={level} className="p-6 border border-gray-200 rounded-xl bg-white shadow-md hover:shadow-lg transition cursor-pointer text-center">
                        <ChartBarIcon className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                        <h2 className="font-bold text-xl text-gray-800">{level}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {level === 'Beginner' ? 'Just starting out.' : level === 'Intermediate' ? 'Can play songs and chords.' : 'Experienced and fluent.'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// FIX: Ensure this default export exists!
export default SkillLevel;