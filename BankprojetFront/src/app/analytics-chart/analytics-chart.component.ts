import { AfterViewInit, Component } from '@angular/core';
import { SmoothieChart, TimeSeries } from 'smoothie';

@Component({
  selector: 'app-analytics-chart',
  standalone: true,
  imports: [],
  templateUrl: './analytics-chart.component.html',
  styleUrl: './analytics-chart.component.css'
})
export class AnalyticsChartComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    const canvas = document.getElementById('chart2') as HTMLCanvasElement;

    if (!canvas) {
      console.error("Canvas 'chart2' not found!");
      return;
    }

    const smoothieChart = new SmoothieChart({ tooltip: true });
    smoothieChart.streamTo(canvas, 500);

    const colors = [
      { stroke: 'rgba(0, 255, 0, 1)', fill: 'rgba(0, 255, 0, 0.2)' },
      { stroke: 'rgba(255, 0, 0, 1)', fill: 'rgba(255, 0, 0, 0.2)' }
    ];

    const pages = ["credit", "debit"];
    const courbe: Record<string, TimeSeries> = {};
    let index = 0;

    const randomColor = () => {
      const col = colors[index % colors.length];
      index++;
      return col;
    };

    pages.forEach(page => {
      courbe[page] = new TimeSeries();
      const color = randomColor();
      smoothieChart.addTimeSeries(courbe[page], {
        strokeStyle: color.stroke,
        fillStyle: color.fill,
        lineWidth: 2
      });
    });
    const eventSource = new EventSource('http://localhost:8087/analytics');

    eventSource.addEventListener('message', event => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        console.log('Données reçues :', data); // 🔍 Pour debug
        const timestamp = new Date().getTime();

        pages.forEach(page => {
          if (data[page] !== undefined) {
            courbe[page].append(timestamp, data[page]);
          }
        });
      } catch (err) {
        console.error('Erreur parsing data:', err);
      }
    });

    eventSource.onerror = (error) => {
      console.error('Erreur EventSource :', error);
    };
  }
}
