import React from 'react';
import FacultyDirectorySvg from '@/svg/banner/FacultyDirectorySvg';
import ScholarshipFinancialSvg from '@/svg/banner/ScholarshipFinancialSvg';
import InteractiveCourseSvg from '@/svg/banner/InteractiveCourseSvg';

// Define types for the FeatureItem props
interface FeatureItemProps {
    IconComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    title: string;
    title2: string;
    isActive?: boolean;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ IconComponent, title, title2, isActive = false }) => (
    <div className={`bd-feature-item ${isActive ? 'has-active' : ''}`}>
        <span className="bd-feature-icon">
            <IconComponent />
        </span>
        <div className="bd-feature-content">
            <h5 className="bd-feature-title">{title}</h5>
            <h6 className="bd-feature-title">{title2}</h6>
        </div>
    </div>
);

const UniversityFeatureSection: React.FC = () => {
    return (
        <div className="bd-feature-area">
            <div className="container">
                <div className="bd-feature-wrapper style-two">
                    <FeatureItem IconComponent={InteractiveCourseSvg} title="Pre-Básica" title2="Bilingüe" />
                    <FeatureItem IconComponent={FacultyDirectorySvg} title="Básica (1 - 9 Bilingüe)" title2="(7 - 9 Español)" isActive />
                    <FeatureItem IconComponent={ScholarshipFinancialSvg} title="Media (10 - 11)" title2="Bilingüe - Español" />
                </div>
            </div>
        </div>
    );
};

export default UniversityFeatureSection;
