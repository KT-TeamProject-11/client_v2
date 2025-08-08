import React from "react";
import styles from "./WelcomeScreen.module.css";

type Props = {
  onSelect: (message: string) => void;
};

const WelcomeScreen = ({ onSelect }: Props) => {
	const menuItems = [
		{ label: "소개", message: "센터 소개를 알려줘" },
		{ label: "오시는 길 & 연락처", message: "오시는 길을 알려줘" },
		{ label: "투어 안내", message: "투어 정보를 알려줘" },
		{ label: "아카데미 모집", message: "아카데미 모집에 대해 알려줘" },
	];

	return (
		<div className={styles.container}>
			<p className={styles.title}>
				안녕하세요!  챗봇입니다.
				<br />
				궁금한 내용을 아래 버튼으로 선택해 보세요.
			</p>
			<div className={styles.grid}>
				{menuItems.map((item) => (
					<button
						key={item.label}
						className={styles.menuButton}
						onClick={() => onSelect(item.message)}
					>
						{item.label}
					</button>
				))}
			</div>
		</div>
	);
};

export default WelcomeScreen;
