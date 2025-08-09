import blogData from '@/data/blog-data';
import React from 'react';
import BlogSingleCard from '../common/blog/BlogSingleCard';

const AcademyBlogArea = () => {
    return (
        <>
            {/* -- blog area start -- */}
            <section className="bd-blog-area">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-xl-6">
                            <div className="bd-section-title-wrapper section-title-space text-center">
                                <span className="bd-section-subtitle">.</span>
                                <h2 className="bd-section-title">Nuestros <span className="down-mark-line">Eventos</span></h2>
                            </div>
                        </div>
                    </div>
                    <div className="row gy-30">
                        {
                            blogData.slice(0, 9).map((item) => (
                                <div className="col-xl-4 col-lg-4 col-md-6" key={item.id}>
                                    <BlogSingleCard item={item} />
                                </div>
                            ))
                        }
                    </div>
                </div>
            </section>
        </>
    );
};

export default AcademyBlogArea;