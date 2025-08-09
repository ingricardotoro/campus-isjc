import { IEvent } from '@/interFace/interFace';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const CourseGridFiveCardEvent = ( event : IEvent) => {
    return (
        <>
            <div className="col-xl-4 col-lg-4 col-md-6" >
                <div className="bd-course-wrapper style-four">
                    <div className="bd-course-thumb-wrapper p-relative mb-20">
                        <Link href={`event/event-details/${event.id}`}>
                            <div className="bd-course-thumb">
                                <Image src={event.image} alt="image" />
                            </div>
                            <div className="shape">{event.shape && <Image style={{ width: "auto", height: "auto" }} src={event.shape} alt="shape" />}</div>
                        </Link>
                    </div>
                    <div className="bd-course-content mb-20">
                        <h5 className="bd-course-title underline mb--5"><Link href={`/courses/course-details/${event.id}`}>{event.title}</Link></h5>
                        <p>{event.description}</p>
                    </div>
                    <div className={`bd-course-info-item-wrapper ${event.image}`}>
                        <div className="bd-course-info-item">
                            <h5 className="bd-course-info-item-title">{event.date}<br /><span>Fecha</span></h5>
                        </div>
                        <div className="bd-course-info-item">
                            <h5 className="bd-course-info-item-title">{event.time}+ <br /><span>Hora</span></h5>
                        </div>
                        <div className="bd-course-info-item">
                            <h5 className="bd-course-info-item-title">{event.location} <br /><span>Lugar</span></h5>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CourseGridFiveCardEvent;