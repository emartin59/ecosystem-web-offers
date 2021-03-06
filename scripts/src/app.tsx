import * as React from "react";

import Carousel from "./ui/container/carousel";
import * as  bridge from "./bridge";
import ImageAndTextPage from "./ui/page/imageAndText";
import { MultichoiceQuestion } from "./ui/page/multichoice.question";
import TimedMultichoiceQuestion from "./ui/page/timed.multichoice.question";
import "../../styles/src/app.styl";
import { EarnThankYou } from "./ui/page/earnThankYou";
import { SuccessBasedThankYou } from "./ui/page/successBasedThankYou";

export interface AppState {
	pages: any;
	currentPage: number;
	isComplete: boolean;
	data: {};
}

export enum PageType {
	FullPageMultiChoice,
	ImageAndText,
	EarnThankYou,
	TimedFullPageMultiChoice,
	SuccessBasedThankYou,
}

// export enum PageType {
// 	FullPageMultiChoice = "FullPageMultiChoice",
// 	ImageAndText = "ImageAndText",
// 	EarnThankYou = "EarnThankYou",
// 	TimedFullPageMultiChoice = "TimedFullPageMultiChoice",
// 	SuccessBasedThankYou = "SuccessBasedThankYou",
// }
//

export interface SharedData {
	wrongAnswers?: {};
	earnedAmount?: number;
}

export interface CommonProps {
	key: number;
	pageIndex: number;
	id: string;
	title: string;
	isDisplayed: boolean;
	totalPagesCount: number;
	currentPage: number;
	sharedData: SharedData;
	updateSharedDate(data: any): void;
}

const sharedPageData = {};
let pages: any = [];

function setRenderPollHandler(callback: () => void) {
	window.kin.renderPoll = data => {
		console.log("In renderPoll:" + JSON.stringify(data));
		pages = data.pages.map((item: any) => {
			if (item.question) {
				item.question.choices = item.question.answers;
			}
			return item;
		});
		callback();
		return;
	};
}

class App extends React.Component {
	public state: AppState;

	constructor(props: any) {
		super(props);
		setRenderPollHandler(() => {
			console.log("renderPoll callback:", pages);
			this.setState({ pages });
		});
		bridge.notifyPageLoaded();
		this.state = {
			pages,
			currentPage: 0,
			isComplete: false,
			data: {},
		};
		this.onPageCompleteHandler = this.onPageCompleteHandler.bind(this);
	}

	public render() {
		console.log("current page:", this.state.currentPage);
		return (
			<div
				className="app">
				<Carousel selectedItem={this.state.currentPage}>
					{this.renderPages()}
				</Carousel>
			</div>
		);
	}

	private onPageCompleteHandler(answerData: any) {
		const allData: any = Object.assign({}, this.state.data, answerData);  // todo pollyfill Object.assign
		const newPageIndex = this.state.currentPage + 1;
		const isComplete = this.state.currentPage === (this.state.pages.length - 1);
		console.log("current: %s, new page: %s, isComplete: %s", this.state.currentPage, newPageIndex, isComplete);

		if (isComplete) {
			if (Object.keys(allData)) {
				console.log("submit " + JSON.stringify(allData));
				bridge.submitResult(allData);
				bridge.close();
			}
			return;
		}

		this.setState({
			currentPage: newPageIndex,
			data: allData,
			isComplete,
		});
	}

	private updateSharedData(data: any) {
		Object.assign(sharedPageData, data);
	}

	private renderPages() {
		return this.state.pages.map((page: any, index: number) => {
			console.log("render pages, this.state.currentPage %s, index %s, page ", this.state.currentPage, index, PageType[ page.type ]);
			const commonProps: CommonProps = {
				key: index,
				pageIndex: index,
				id: page.question && page.question.id,
				title: page.title,
				isDisplayed: this.state.currentPage === index,
				totalPagesCount: this.state.pages.length,
				currentPage: this.state.currentPage,
				sharedData: sharedPageData,
				updateSharedDate: this.updateSharedData,
			};

			switch (page.type) {
				case PageType.FullPageMultiChoice:
					return <MultichoiceQuestion {...commonProps} choices={page.question.choices} description={page.description} onSelected={this.onPageCompleteHandler} rightAnswer={page.rightAnswer}/>;
				case PageType.ImageAndText:
					return <ImageAndTextPage {...commonProps} image={page.image} footerHtml={page.footerHtml} bodyHtml={page.bodyHtml} buttonText={page.buttonText} onBtnClick={this.onPageCompleteHandler}/>;
				case PageType.EarnThankYou:
					return <EarnThankYou {...commonProps} isDisplayed={this.state.currentPage === index} closeHandler={this.onPageCompleteHandler} hideTopBarHandler={bridge.hideTopBar} amount={page.description}/>;
				case PageType.TimedFullPageMultiChoice:
					return <TimedMultichoiceQuestion {...commonProps} choices={page.question.choices} title={page.description} onSelected={this.onPageCompleteHandler} amount={page.amount} rightAnswer={page.rightAnswer}/>;
				case PageType.SuccessBasedThankYou:
					return <SuccessBasedThankYou {...commonProps} isDisplayed={this.state.currentPage === index} closeHandler={this.onPageCompleteHandler} hideTopBarHandler={bridge.hideTopBar}/>;
			}
		});
	}
}

export default App;
