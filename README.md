# Tomate Timer

My own implementation of the [Pomodoro®](https://francescocirillo.com/pages/pomodoro-technique) timer.

## Installation

This timer is just a static html page. So you just need to download the repository and open the `index.html` file.

```bash
git clone https://github.com/y-garcia/tomate-timer.git
cd tomate-timer
index.html
```

## Usage

The purpose of the Pomodoro® technique is to work focused for 25 minutes and then take a 5-minute break.
This is called a _pomodoro_. After 4 pomodoros you take a longer break of, say, 20 minutes.
  
1. When you open the page you see a timer and a `start` and `reset` button.
2. When you press start the 25-minute `work` timer begins to count down.
3. After 25 minutes the timer will ring and the 5-minute `break` timer begins automatically.
4. This is one pomodoro so the `sessions` counter will increase by one.
5. After running for 4 consecutive times the `long break` timer will start.
6. If you want to configure the timer differently, do so in the `settings` by clicking on the `gear` icon.

There is also a distraction-free mode:
1. Start the distraction-free mode by clicking on the `maximize` button.
2. This will change the background to black and only show the `running timer`, a `sessions badge` and a `back` arrow.
3. You can still control the timer in this mode:
    - `Left click:` start/stop timer.
    - `Middle click:` reset the current timer to its default time.
        - By middle-clicking again it will switch to the `work` timer.
        - By middle-clicking again it will reset the `sessions badge` to 0.
    - `Right click:` switch to next timer (e.g. from `work` to `break`, if you so desire)
4. You can also control the sessions badge independently:
    - `Left click (on the badge):` increase the sessions by one.
    - `Middle click (on the badge):` reset the sessions to 0.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/y-garcia/tomate-timer/tags).

See the [CHANGELOG.md](CHANGELOG.md) file for details. 

## Authors

* **Yeray García Quintana** - Initial work - [y-garcia](https://github.com/y-garcia)

See also the list of [contributors](https://github.com/y-garcia/tomate-timer/contributors) who participated in this project.

## License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/). See the [LICENSE](LICENSE) file for details.
