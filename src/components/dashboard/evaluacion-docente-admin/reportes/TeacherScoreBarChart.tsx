"use client";
import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false });

interface TeacherScoreBarChartProps {
  categories: string[];
  data: number[];
  title?: string;
}

const TeacherScoreBarChart = ({ categories, data, title }: TeacherScoreBarChartProps) => {
  const options: ApexOptions = {
    series: [{ name: "Promedio", data }],
    chart: {
      height: 350,
      type: "bar",
      toolbar: { show: false },
    },
    colors: ["#002147"],
    plotOptions: {
      bar: { borderRadius: 4, horizontal: true },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toFixed(2),
    },
    xaxis: {
      categories,
      min: 0,
      max: 4,
      title: { text: "Promedio (1 = Mejorar, 4 = Excelente)" },
    },
    title: title ? { text: title } : undefined,
  };

  return (
    <div id="teacherScoreBarChart">
      <ApexCharts options={options} series={options.series} type="bar" height={350} />
    </div>
  );
};

export default TeacherScoreBarChart;
